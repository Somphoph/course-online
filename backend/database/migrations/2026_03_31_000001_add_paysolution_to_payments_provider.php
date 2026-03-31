<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE payments MODIFY COLUMN provider ENUM('manual','omise','stripe','paysolution') NOT NULL DEFAULT 'manual'");
        } else {
            // SQLite doesn't support MODIFY COLUMN, so we need to recreate the table
            // This is a safe operation since we're only adding a new enum value
            DB::statement("PRAGMA foreign_keys=OFF");

            // Create temporary table with new enum
            DB::statement(
                "CREATE TABLE payments_new AS
                SELECT id, enrollment_id, user_id, course_id, amount, currency, provider, provider_ref, status, created_at, updated_at
                FROM payments"
            );

            // Drop original table
            DB::statement("DROP TABLE payments");

            // Recreate table with new enum definition
            DB::statement("
                CREATE TABLE payments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    enrollment_id BIGINT NOT NULL,
                    user_id BIGINT NOT NULL,
                    course_id BIGINT NOT NULL,
                    amount DECIMAL(10, 2) NOT NULL,
                    currency TEXT NOT NULL DEFAULT 'THB' CHECK(currency IN ('THB')),
                    provider TEXT NOT NULL DEFAULT 'manual' CHECK(provider IN ('manual', 'omise', 'stripe', 'paysolution')),
                    provider_ref TEXT,
                    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'success', 'failed')),
                    created_at DATETIME,
                    updated_at DATETIME,
                    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (course_id) REFERENCES courses(id)
                )
            ");

            // Copy data back
            DB::statement(
                "INSERT INTO payments (id, enrollment_id, user_id, course_id, amount, currency, provider, provider_ref, status, created_at, updated_at)
                SELECT id, enrollment_id, user_id, course_id, amount, currency, provider, provider_ref, status, created_at, updated_at
                FROM payments_new"
            );

            // Drop temporary table
            DB::statement("DROP TABLE payments_new");

            // Recreate indexes
            DB::statement("CREATE INDEX IF NOT EXISTS payments_enrollment_id_index ON payments (enrollment_id)");
            DB::statement("CREATE INDEX IF NOT EXISTS payments_user_id_index ON payments (user_id)");
            DB::statement("CREATE INDEX IF NOT EXISTS payments_course_id_index ON payments (course_id)");

            DB::statement("PRAGMA foreign_keys=ON");
        }
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE payments MODIFY COLUMN provider ENUM('manual','omise','stripe') NOT NULL DEFAULT 'manual'");
        } else {
            // SQLite: recreate with old enum definition
            DB::statement("PRAGMA foreign_keys=OFF");

            DB::statement(
                "CREATE TABLE payments_new AS
                SELECT id, enrollment_id, user_id, course_id, amount, currency, provider, provider_ref, status, created_at, updated_at
                FROM payments"
            );

            DB::statement("DROP TABLE payments");

            DB::statement("
                CREATE TABLE payments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    enrollment_id BIGINT NOT NULL,
                    user_id BIGINT NOT NULL,
                    course_id BIGINT NOT NULL,
                    amount DECIMAL(10, 2) NOT NULL,
                    currency TEXT NOT NULL DEFAULT 'THB' CHECK(currency IN ('THB')),
                    provider TEXT NOT NULL DEFAULT 'manual' CHECK(provider IN ('manual', 'omise', 'stripe')),
                    provider_ref TEXT,
                    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'success', 'failed')),
                    created_at DATETIME,
                    updated_at DATETIME,
                    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (course_id) REFERENCES courses(id)
                )
            ");

            DB::statement(
                "INSERT INTO payments (id, enrollment_id, user_id, course_id, amount, currency, provider, provider_ref, status, created_at, updated_at)
                SELECT id, enrollment_id, user_id, course_id, amount, currency, provider, provider_ref, status, created_at, updated_at
                FROM payments_new"
            );

            DB::statement("DROP TABLE payments_new");

            // Recreate indexes
            DB::statement("CREATE INDEX IF NOT EXISTS payments_enrollment_id_index ON payments (enrollment_id)");
            DB::statement("CREATE INDEX IF NOT EXISTS payments_user_id_index ON payments (user_id)");
            DB::statement("CREATE INDEX IF NOT EXISTS payments_course_id_index ON payments (course_id)");

            DB::statement("PRAGMA foreign_keys=ON");
        }
    }
};
