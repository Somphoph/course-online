<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE bundle_payments MODIFY COLUMN provider ENUM('manual','paysolution') NOT NULL DEFAULT 'manual'");
        } else {
            // SQLite doesn't support MODIFY COLUMN, so we need to recreate the table
            DB::statement("PRAGMA foreign_keys=OFF");

            // Create temporary table with new enum
            DB::statement(
                "CREATE TABLE bundle_payments_new AS
                SELECT id, bundle_enrollment_id, user_id, bundle_id, amount, currency, provider, provider_ref, status, created_at, updated_at
                FROM bundle_payments"
            );

            // Drop original table
            DB::statement("DROP TABLE bundle_payments");

            // Recreate table with new enum definition
            DB::statement("
                CREATE TABLE bundle_payments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    bundle_enrollment_id BIGINT NOT NULL,
                    user_id BIGINT NOT NULL,
                    bundle_id BIGINT NOT NULL,
                    amount DECIMAL(10, 2) NOT NULL,
                    currency TEXT NOT NULL DEFAULT 'THB' CHECK(currency IN ('THB')),
                    provider TEXT NOT NULL DEFAULT 'manual' CHECK(provider IN ('manual', 'paysolution')),
                    provider_ref TEXT,
                    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'success', 'failed')),
                    created_at DATETIME,
                    updated_at DATETIME,
                    FOREIGN KEY (bundle_enrollment_id) REFERENCES bundle_enrollments(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (bundle_id) REFERENCES bundles(id) ON DELETE CASCADE
                )
            ");

            // Copy data back
            DB::statement(
                "INSERT INTO bundle_payments (id, bundle_enrollment_id, user_id, bundle_id, amount, currency, provider, provider_ref, status, created_at, updated_at)
                SELECT id, bundle_enrollment_id, user_id, bundle_id, amount, currency, provider, provider_ref, status, created_at, updated_at
                FROM bundle_payments_new"
            );

            // Drop temporary table
            DB::statement("DROP TABLE bundle_payments_new");

            DB::statement("PRAGMA foreign_keys=ON");
        }
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE bundle_payments MODIFY COLUMN provider ENUM('manual') NOT NULL DEFAULT 'manual'");
        } else {
            // SQLite: recreate with old enum definition
            DB::statement("PRAGMA foreign_keys=OFF");

            DB::statement(
                "CREATE TABLE bundle_payments_new AS
                SELECT id, bundle_enrollment_id, user_id, bundle_id, amount, currency, provider, provider_ref, status, created_at, updated_at
                FROM bundle_payments"
            );

            DB::statement("DROP TABLE bundle_payments");

            DB::statement("
                CREATE TABLE bundle_payments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    bundle_enrollment_id BIGINT NOT NULL,
                    user_id BIGINT NOT NULL,
                    bundle_id BIGINT NOT NULL,
                    amount DECIMAL(10, 2) NOT NULL,
                    currency TEXT NOT NULL DEFAULT 'THB' CHECK(currency IN ('THB')),
                    provider TEXT NOT NULL DEFAULT 'manual' CHECK(provider IN ('manual')),
                    provider_ref TEXT,
                    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'success', 'failed')),
                    created_at DATETIME,
                    updated_at DATETIME,
                    FOREIGN KEY (bundle_enrollment_id) REFERENCES bundle_enrollments(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (bundle_id) REFERENCES bundles(id) ON DELETE CASCADE
                )
            ");

            DB::statement(
                "INSERT INTO bundle_payments (id, bundle_enrollment_id, user_id, bundle_id, amount, currency, provider, provider_ref, status, created_at, updated_at)
                SELECT id, bundle_enrollment_id, user_id, bundle_id, amount, currency, provider, provider_ref, status, created_at, updated_at
                FROM bundle_payments_new"
            );

            DB::statement("DROP TABLE bundle_payments_new");

            DB::statement("PRAGMA foreign_keys=ON");
        }
    }
};
