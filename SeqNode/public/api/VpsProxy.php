<?php

declare(strict_types=1);

/**
 * VpsProxy — Forwards API requests to the FastAPI backend on Oracle VPS.
 *
 * Called for engine routes that are not served locally (workflow, execute,
 * settings, runs, references, etc.). Requires a valid JWT session so that
 * only authenticated users can reach the VPS.
 */
class VpsProxy
{
    private static function vpsBase(): string
    {
        // Read VPS URL from .env (same file used by the PHP auth backend)
        $url = Env::get('API_URL', Env::get('VPS_API_URL', ''));
        return rtrim($url, '/');
    }

    /**
     * Forward the current request to the VPS and emit the response.
     * Terminates (echo + exit) after forwarding.
     *
     * @param bool $softFail  When true, convert any 5xx VPS response (or cURL
     *                        failure) to HTTP 200 {"ok":false,"reason":"..."}.
     *                        Use for agent-optional endpoints so the browser
     *                        network tab does not show red requests when the
     *                        agent is simply not connected.
     */
    public static function forward(bool $softFail = false): void
    {
        $base = self::vpsBase();
        if (empty($base)) {
            if ($softFail) {
                http_response_code(200);
                header('Content-Type: application/json');
                echo json_encode(['ok' => false, 'reason' => 'vps_not_configured']);
                exit;
            }
            http_response_code(503);
            header('Content-Type: application/json');
            echo json_encode(['detail' => 'VPS backend URL not configured.']);
            exit;
        }

        // Reconstruct the original request URI (with /api prefix intact)
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $url = $base . $uri;

        $method = $_SERVER['REQUEST_METHOD'];
        $ch     = curl_init($url);

        // Timeouts: connect 5 s, total 120 s (long-running executions need more)
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
        curl_setopt($ch, CURLOPT_TIMEOUT,        120);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST,  $method);

        // SSL verification (keep enabled in production)
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

        // Forward useful request headers
        $reqHeaders = ['Accept: application/json'];

        $ct = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
        if ($ct) {
            $reqHeaders[] = 'Content-Type: ' . $ct;
        } else {
            $reqHeaders[] = 'Content-Type: application/json';
        }

        // Forward Authorization if present
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            $reqHeaders[] = 'Authorization: ' . $_SERVER['HTTP_AUTHORIZATION'];
        }

        // Inject authenticated user identity so the VPS can route execution
        // to the user's connected agent without performing its own JWT validation.
        try {
            $authPayload = Auth::require();
            $reqHeaders[] = 'X-Seqnode-User-Id: '    . ((int) $authPayload['user_id']);
            $reqHeaders[] = 'X-Seqnode-Is-Admin: '   . (!empty($authPayload['is_admin']) ? '1' : '0');
        } catch (\Throwable $_) {
            // Should not happen — Auth::require() was already called before us.
        }

        curl_setopt($ch, CURLOPT_HTTPHEADER, $reqHeaders);

        // Forward body for non-GET methods
        if (in_array($method, ['POST', 'PUT', 'PATCH'], true)) {
            $body = file_get_contents('php://input');
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body !== false ? $body : '');
        }

        // Capture response headers so we can forward Content-Type
        $responseHeaders = [];
        curl_setopt($ch, CURLOPT_HEADERFUNCTION, function ($ch, $header) use (&$responseHeaders) {
            $parts = explode(':', $header, 2);
            if (count($parts) === 2) {
                $responseHeaders[strtolower(trim($parts[0]))] = trim($parts[1]);
            }
            return strlen($header);
        });

        $body     = curl_exec($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr  = curl_error($ch);
        curl_close($ch);

        // cURL-level error (network unreachable, timeout, etc.)
        if ($body === false || $curlErr) {
            if ($softFail) {
                http_response_code(200);
                header('Content-Type: application/json');
                echo json_encode(['ok' => false, 'reason' => 'vps_unreachable']);
                exit;
            }
            http_response_code(502);
            header('Content-Type: application/json');
            echo json_encode([
                'detail' => 'VPS backend unreachable. Please check that the execution server is running.',
                'error'  => $curlErr ?: 'cURL error',
            ]);
            exit;
        }

        // 5xx from VPS → soft 200 for agent-optional endpoints
        if ($softFail && $httpCode >= 500) {
            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode(['ok' => false, 'reason' => 'agent_unavailable']);
            exit;
        }

        // Relay status and content-type
        http_response_code($httpCode ?: 502);
        $ct = $responseHeaders['content-type'] ?? 'application/json';
        header('Content-Type: ' . $ct);

        echo $body;
        exit;
    }

    /**
     * Convenience alias — forward to VPS but never surface 5xx to the browser.
     * Use for endpoints where failure is expected (agent not connected, etc.).
     */
    public static function forwardSoft(): void
    {
        self::forward(true);
    }
}
