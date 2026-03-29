<?php
// /api/google_oauth.php
require_once 'config.php';
// Autoloader is now handled in config.php

// Use the helper function from config.php for consistency
$client = new Google_Client();
$client->setClientId(get_env_var('GOOGLE_CLIENT_ID'));
$client->setClientSecret(get_env_var('GOOGLE_CLIENT_SECRET'));
$client->setRedirectUri(get_env_var('GOOGLE_REDIRECT_URI'));
$client->addScope("email");
$client->addScope("profile");

// Redirect to Google's authentication page
$auth_url = $client->createAuthUrl();
header('Location: ' . filter_var($auth_url, FILTER_SANITIZE_URL));
exit();

