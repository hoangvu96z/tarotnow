<?php
// proxy.php - PHP Reverse Proxy to bypass HTTPS mixed content restriction on CPanel hosting
// Forwards requests from /api-vps/* to VPS on port 80 (via Nginx reverse proxy)

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Extract the path after /api-vps/
$path = '';
$requestUri = $_SERVER['REQUEST_URI'];
if (preg_match('/\/api-vps\/(.*)$/', $requestUri, $matches)) {
    $path = explode('?', $matches[1])[0];
}

// Target VPS on port 80 (Nginx listens here and forwards to 9Router on port 20128)
$targetUrl = "http://43.128.116.69/" . $path;

// Forward query parameters
if (!empty($_SERVER['QUERY_STRING'])) {
    $targetUrl .= "?" . $_SERVER['QUERY_STRING'];
}

// Get request body
$requestBody = file_get_contents('php://input');

// Forward request headers
$headers = [];
if (function_exists('getallheaders')) {
    foreach (getallheaders() as $name => $value) {
        $lower = strtolower($name);
        if (in_array($lower, ['host', 'content-length', 'accept-encoding'])) continue;
        $headers[] = "$name: $value";
    }
} else {
    foreach ($_SERVER as $name => $value) {
        if (substr($name, 0, 5) !== 'HTTP_') continue;
        $headerName = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))));
        $lower = strtolower($headerName);
        if (in_array($lower, ['host', 'content-length', 'accept-encoding'])) continue;
        $headers[] = "$headerName: $value";
    }
}

$ch = curl_init($targetUrl);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
curl_setopt($ch, CURLOPT_POSTFIELDS, $requestBody);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
curl_setopt($ch, CURLOPT_TIMEOUT, 120);

// Stream response
curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($curl, $data) {
    echo $data;
    if (ob_get_level() > 0) ob_flush();
    flush();
    return strlen($data);
});

$ok = curl_exec($ch);
if ($ok === false) {
    $err = curl_error($ch);
    http_response_code(502);
    echo "Proxy Error: " . $err;
}
curl_close($ch);
