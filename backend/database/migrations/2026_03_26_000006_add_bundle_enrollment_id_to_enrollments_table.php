<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
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
        });
    }
};
