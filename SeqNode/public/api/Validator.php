<?php

declare(strict_types=1);

class Validator
{
    private array $errors = [];
    private array $data   = [];

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public static function make(array $data, array $rules): self
    {
        $v = new self($data);
        foreach ($rules as $field => $ruleStr) {
            $v->applyRules($field, $ruleStr);
        }
        return $v;
    }

    private function applyRules(string $field, string $ruleStr): void
    {
        $rules = explode('|', $ruleStr);
        $value = $this->data[$field] ?? null;

        foreach ($rules as $rule) {
            [$name, $param] = array_pad(explode(':', $rule, 2), 2, null);

            match ($name) {
                'required'  => $this->checkRequired($field, $value),
                'email'     => $this->checkEmail($field, $value),
                'min'       => $this->checkMin($field, $value, (int)$param),
                'max'       => $this->checkMax($field, $value, (int)$param),
                'confirmed' => $this->checkConfirmed($field, $value),
                'in'        => $this->checkIn($field, $value, explode(',', $param ?? '')),
                'uuid'      => $this->checkUuid($field, $value),
                'numeric'   => $this->checkNumeric($field, $value),
                'url'       => $this->checkUrl($field, $value),
                default     => null,
            };
        }
    }

    private function checkRequired(string $f, mixed $v): void
    {
        if ($v === null || $v === '') $this->errors[$f][] = "The field '$f' is required.";
    }

    private function checkEmail(string $f, mixed $v): void
    {
        if ($v !== null && $v !== '' && !filter_var($v, FILTER_VALIDATE_EMAIL))
            $this->errors[$f][] = "The field '$f' must be a valid email address.";
    }

    private function checkMin(string $f, mixed $v, int $min): void
    {
        if ($v !== null && strlen((string)$v) < $min)
            $this->errors[$f][] = "The field '$f' must be at least $min characters.";
    }

    private function checkMax(string $f, mixed $v, int $max): void
    {
        if ($v !== null && strlen((string)$v) > $max)
            $this->errors[$f][] = "The field '$f' must not exceed $max characters.";
    }

    private function checkConfirmed(string $f, mixed $v): void
    {
        if ($v !== ($this->data[$f . '_confirmation'] ?? null))
            $this->errors[$f][] = "The passwords do not match.";
    }

    private function checkIn(string $f, mixed $v, array $allowed): void
    {
        if ($v !== null && $v !== '' && !in_array($v, $allowed, true))
            $this->errors[$f][] = "Invalid value for '$f'. Allowed: " . implode(', ', $allowed);
    }

    private function checkUuid(string $f, mixed $v): void
    {
        $pattern = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';
        if ($v !== null && $v !== '' && !preg_match($pattern, (string)$v))
            $this->errors[$f][] = "The field '$f' must be a valid UUID.";
    }

    private function checkNumeric(string $f, mixed $v): void
    {
        if ($v !== null && $v !== '' && !is_numeric($v))
            $this->errors[$f][] = "The field '$f' must be numeric.";
    }

    private function checkUrl(string $f, mixed $v): void
    {
        if ($v !== null && $v !== '' && !filter_var($v, FILTER_VALIDATE_URL))
            $this->errors[$f][] = "The field '$f' must be a valid URL.";
    }

    public function fails(): bool   { return !empty($this->errors); }
    public function errors(): array { return $this->errors; }
}
