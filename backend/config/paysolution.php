<?php

return [
    'merchant_id'      => env('PAYSOLUTION_MERCHANT_ID'),
    'api_key'          => env('PAYSOLUTION_API_KEY'),
    'secret_key'       => env('PAYSOLUTION_SECRET_KEY'),
    'webhook_secret'   => env('PAYSOLUTION_WEBHOOK_SECRET'),
    'create_order_url' => env('PAYSOLUTION_CREATE_ORDER_URL', 'https://api.paysolutions.asia/v1/promptpay/order'),
    'signature_header' => env('PAYSOLUTION_SIGNATURE_HEADER', 'X-PaySolution-Signature'),
    'order_ref_keys'   => ['orderId', 'order_id', 'invoiceNo', 'invoice_no'],
    'status_keys'      => ['status', 'paymentStatus', 'payment_status'],
    'success_statuses' => ['success', 'successful', 'paid', 'completed'],
    'response_map'     => [
        'qr_image' => ['qrImage', 'qr_image', 'qrCode', 'qr_code', 'img'],
        'expires_at' => ['expiresAt', 'expires_at', 'expiredAt', 'expired_at'],
        'order_ref' => ['orderId', 'order_id', 'invoiceNo', 'invoice_no'],
    ],
];
