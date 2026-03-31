<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('bundle_payment_id')->nullable()->constrained('bundle_payments')->nullOnDelete();
            $table->enum('event_type', [
                'qr_created',
                'webhook_received',
                'approved',
                'failed',
                'expired',
                'retry',
                'webhook_rejected',
            ]);
            $table->json('payload')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_events');
    }
};
