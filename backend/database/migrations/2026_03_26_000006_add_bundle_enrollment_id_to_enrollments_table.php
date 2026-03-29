<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            // MySQL uses the composite unique index as the backing index for the user_id FK.
            // Add standalone indexes first so MySQL allows the unique constraint to be dropped.
            $table->index('user_id', 'enrollments_user_id_index');
            $table->index('course_id', 'enrollments_course_id_index');
            $table->dropUnique(['user_id', 'course_id']);

            $table->foreignId('package_enrollment_id')
                ->nullable()
                ->after('approved_by')
                ->constrained('package_enrollments')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropForeign(['package_enrollment_id']);
            $table->dropColumn('package_enrollment_id');
            $table->unique(['user_id', 'course_id']);
            $table->dropIndex('enrollments_user_id_index');
            $table->dropIndex('enrollments_course_id_index');
        });
    }
};
