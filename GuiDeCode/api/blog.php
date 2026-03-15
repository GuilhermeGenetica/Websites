<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/middleware.php';

cors();

// Garantindo que $conn exista localmente, buscando do config
$conn = getDbConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$action = $_GET['action'] ?? '';
$data = json_decode(file_get_contents("php://input"));

switch ($action) {
    case 'getArticles':
        try {
            $stmt = $conn->prepare("SELECT * FROM articles ORDER BY created_at DESC");
            $stmt->execute();
            $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($articles);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'getPublishedArticles':
        try {
            $stmt = $conn->prepare("SELECT * FROM articles WHERE published = 1 ORDER BY published_at DESC");
            $stmt->execute();
            $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($articles);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'getArticleById':
        if (isset($_GET['id'])) {
            try {
                $stmt = $conn->prepare("SELECT * FROM articles WHERE id = ?");
                $stmt->execute([$_GET['id']]);
                $article = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($article) {
                    echo json_encode($article);
                } else {
                    http_response_code(404);
                    echo json_encode(["error" => "Article not found"]);
                }
            } catch (\Exception $e) {
                http_response_code(500);
                echo json_encode(["error" => $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Missing article ID"]);
        }
        break;

    case 'saveArticle':
        if ($method === 'POST') {
            try {
                $isPublished = false;
                if (isset($data->published)) {
                    if ($data->published === true || $data->published === 1 || $data->published === "1") {
                        $isPublished = true;
                    }
                }
                $published = $isPublished ? 1 : 0;
                $publishedAt = ($published === 1) ? date('Y-m-d H:i:s') : null;
                $featuredImage = $data->featured_image ?? $data->featuredImage ?? null;
                $tagsJson = is_array($data->tags) ? json_encode($data->tags) : ($data->tags ?? '[]');
                $articleId = $data->id ?? $data->customId ?? uniqid('art_');
                $title = $data->title ?? '';
                $content = $data->content ?? '';
                $excerpt = $data->excerpt ?? '';

                $check = $conn->prepare("SELECT id FROM articles WHERE id = ?");
                $check->execute([$articleId]);

                if ($check->rowCount() > 0) {
                    $sql = "UPDATE articles SET title=?, content=?, excerpt=?, featured_image=?, tags=?, published=?, updated_at=NOW()";
                    $params = [$title, $content, $excerpt, $featuredImage, $tagsJson, $published];

                    if ($publishedAt) {
                        $sql .= ", published_at=COALESCE(published_at, ?)";
                        $params[] = $publishedAt;
                    }

                    $sql .= " WHERE id=?";
                    $params[] = $articleId;

                    $stmt = $conn->prepare($sql);
                    $stmt->execute($params);
                } else {
                    $stmt = $conn->prepare("INSERT INTO articles (id, title, content, excerpt, featured_image, tags, views, published, created_at, updated_at, published_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, NOW(), NOW(), ?)");
                    $stmt->execute([$articleId, $title, $content, $excerpt, $featuredImage, $tagsJson, $published, $publishedAt]);
                }

                echo json_encode(["success" => true, "id" => $articleId]);
            } catch (\Exception $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => $e->getMessage()]);
            }
        }
        break;

    case 'deleteArticle':
        if ($method === 'POST' && isset($data->id)) {
            try {
                $stmt = $conn->prepare("DELETE FROM articles WHERE id = ?");
                $stmt->execute([$data->id]);
                echo json_encode(["success" => true]);
            } catch (\Exception $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Missing article ID"]);
        }
        break;

    case 'publishArticle':
        if ($method === 'POST' && isset($data->id)) {
            try {
                $stmt = $conn->prepare("UPDATE articles SET published = 1, published_at = COALESCE(published_at, NOW()), updated_at = NOW() WHERE id = ?");
                $stmt->execute([$data->id]);
                echo json_encode(["success" => true]);
            } catch (\Exception $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Missing article ID"]);
        }
        break;

    case 'unpublishArticle':
        if ($method === 'POST' && isset($data->id)) {
            try {
                $stmt = $conn->prepare("UPDATE articles SET published = 0, updated_at = NOW() WHERE id = ?");
                $stmt->execute([$data->id]);
                echo json_encode(["success" => true]);
            } catch (\Exception $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Missing article ID"]);
        }
        break;

    case 'incrementViews':
        if ($method === 'POST' && isset($data->id)) {
            try {
                $stmt = $conn->prepare("UPDATE articles SET views = views + 1 WHERE id = ?");
                $stmt->execute([$data->id]);
                echo json_encode(["success" => true]);
            } catch (\Exception $e) {
                http_response_code(500);
                echo json_encode(["error" => $e->getMessage()]);
            }
        }
        break;

    case 'uploadImage':
        if ($method === 'POST' && isset($_FILES['file'])) {
            // Utilizando o UPLOAD_DIR definido via .env
            $uploadDir = UPLOAD_DIR;
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            $file = $_FILES['file'];
            $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            $targetName = uniqid() . '_' . bin2hex(random_bytes(4)) . '.' . $extension;
            $targetPath = $uploadDir . $targetName;

            $allowedMimeTypes = [
                'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
                'video/mp4', 'video/webm', 'video/ogg'
            ];

            $fileMimeType = mime_content_type($file['tmp_name']);

            if (in_array($fileMimeType, $allowedMimeTypes)) {
                if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
                    $url = "$protocol://$_SERVER[HTTP_HOST]/uploads/$targetName";
                    $type = strpos($fileMimeType, 'video') === 0 ? 'video' : 'image';
                    echo json_encode(["url" => $url, "type" => $type, "success" => true]);
                } else {
                    http_response_code(500);
                    echo json_encode(["error" => "Failed to move uploaded file"]);
                }
            } else {
                http_response_code(400);
                echo json_encode(["error" => "Invalid file format. Allowed: JPEG, PNG, GIF, WebP, SVG, MP4, WebM, OGG"]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "No file received"]);
        }
        break;

    case 'login':
        if ($method === 'POST') {
            try {
                $email = $data->email ?? '';
                $password = $data->password ?? '';

                $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
                $stmt->execute([$email]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($user && password_verify($password, $user['password'])) {
                    if ($user['is_admin'] == 1) {
                        $token = bin2hex(random_bytes(32));
                        echo json_encode([
                            "success" => true,
                            "token" => $token,
                            "user" => [
                                "id" => $user['id'],
                                "email" => $user['email'],
                                "full_name" => $user['full_name'],
                                "role" => "admin"
                            ]
                        ]);
                    } else {
                        http_response_code(403);
                        echo json_encode(["success" => false, "message" => "Access denied. Insufficient permissions."]);
                    }
                } else {
                    http_response_code(401);
                    echo json_encode(["success" => false, "message" => "Invalid credentials."]);
                }
            } catch (\Exception $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => $e->getMessage()]);
            }
        }
        break;

    case 'subscribe':
        if ($method === 'POST') {
            try {
                $email = $data->email ?? '';
                if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    http_response_code(400);
                    echo json_encode(["success" => false, "message" => "Invalid email address."]);
                    break;
                }

                $check = $conn->prepare("SELECT id FROM newsletter_subscribers WHERE email = ?");
                $check->execute([$email]);
                if ($check->rowCount() > 0) {
                    echo json_encode(["success" => true, "message" => "You are already subscribed!"]);
                    break;
                }

                $stmt = $conn->prepare("INSERT INTO newsletter_subscribers (email, subscribed_at) VALUES (?, NOW())");
                $stmt->execute([$email]);
                echo json_encode(["success" => true, "message" => "Successfully subscribed!"]);
            } catch (\Exception $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Subscription failed."]);
            }
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(["error" => "Invalid action: " . $action]);
        break;
}
?>