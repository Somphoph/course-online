<?php

return [
    'library_id' => env('BUNNY_LIBRARY_ID'),
    'api_key' => env('BUNNY_API_KEY'),
    'cdn_hostname' => env('BUNNY_CDN_HOSTNAME'),
    'token_key' => env('BUNNY_TOKEN_KEY'),
    'token_expiry' => (int) env('BUNNY_TOKEN_EXPIRY', 7200),
];
