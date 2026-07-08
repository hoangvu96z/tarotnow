<?php
// proxy.php - PHP Reverse Proxy for 9Router VPS to bypass CORS and HTTPS mixed content on CPanel hosting

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$path = isset($_GET['path']) ? $_GET['path'] : '';
if (empty($path)) {
    $requestUri = $_SERVER['REQUEST_URI'];
    if (preg_match('/api-vps\/(.*)$/', $requestUri, $matches)) {
        $path = explode('?', $matches[1])[0];
    }
}

// Target VPS endpoint
$targetUrl = "http://43.128.116.69:20128/" . $path;

// Forward query parameters
if (!empty($_SERVER['QUERY_STRING'])) {
    $queryString = $_SERVER['QUERY_STRING'];
    $queryString = preg_replace('/&?path=[^&]*/', '', $queryString);
    if (!empty($queryString)) {
        $targetUrl .= "?" . ltrim($queryString, '&');
    }
}

// Get request body
$requestBody = file_get_contents('php://input');

// Forward headers
$headers = [];
if (function_exists('getallheaders')) {
    $incomingHeaders = getallheaders();
    foreach ($incomingHeaders as $name => $value) {
        $lowerName = strtolower($name);
        if ($lowerName === 'host' || $lowerName === 'content-length' || $lowerName === 'accept-encoding') {
            continue;
        }
        $headers[] = "$name: $value";
    }
} else {
    // Fallback if getallheaders is not available
    foreach ($_SERVER as $name => $value) {
        if (substr($name, 0, 5) == 'HTTP_') {
            $headerName = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))));
            $lowerName = strtolower($headerName);
            if ($lowerName === 'host' || $lowerName === 'content-length' || $lowerName === 'accept-encoding') {
                continue;
            }
            $headers[] = "$headerName: $value";
        }
    }
}

$ch = curl_init($targetUrl);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
curl_setopt($ch, CURLOPT_POSTFIELDS, $requestBody);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

// Set SSL parameters
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

// Stream response support
curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($curl, $data) {
    echo $data;
    if (ob_get_level() > 0) {
        ob_flush();
    }
    flush();
    return strlen($data);
});

curl_exec($ch);
curl_close($ch);
