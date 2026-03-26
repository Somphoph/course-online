<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('packages') && ! Schema::hasTable('bundles')) {
            Schema::rename('packages', 'bundles');
        }

        if (Schema::hasTable('package_courses') && ! Schema::hasTable('bundle_courses')) {
            Schema::rename('package_courses', 'bundle_courses');
        }

        if (Schema::hasTable('package_enrollments') && ! Schema::hasTable('bundle_enrollments')) {
            Schema::rename('package_enrollments', 'bundle_enrollments');
        }

        if (Schema::hasTable('package_payments') && ! Schema::hasTable('bundle_payments')) {
            Schema::rename('package_payments', 'bundle_payments');
        }

        if (Schema::hasTable('bundle_courses') && Schema::hasColumn('bundle_courses', 'package_id')) {
            Schema::table('bundle_courses', function (Blueprint $table): void {
                $table->renameColumn('package_id', 'bundle_id');
            });
        }

        if (Schema::hasTable('bundle_enrollments') && Schema::hasColumn('bundle_enrollments', 'package_id')) {
            Schema::table('bundle_enrollments', function (Blueprint $table): void {
                $table->renameColumn('package_id', 'bundle_id');
            });
        }

        if (Schema::hasTable('bundle_payments')) {
            Schema::table('bundle_payments', function (Blueprint $table): void {
                if (Schema::hasColumn('bundle_payments', 'package_enrollment_id')) {
                    $table->renameColumn('package_enrollment_id', 'bundle_enrollment_id');
                }

                if (Schema::hasColumn('bundle_payments', 'package_id')) {
                    $table->renameColumn('package_id', 'bundle_id');
                }
            });
        }

        if (Schema::hasTable('enrollments') && Schema::hasColumn('enrollments', 'package_enrollment_id')) {
            Schema::table('enrollments', function (Blueprint $table): void {
                $table->renameColumn('package_enrollment_id', 'bundle_enrollment_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('enrollments') && Schema::hasColumn('enrollments', 'bundle_enrollment_id')) {
            Schema::table('enrollments', function (Blueprint $table): void {
                $table->renameColumn('bundle_enrollment_id', 'package_enrollment_id');
            });
        }

        if (Schema::hasTable('bundle_payments')) {
            Schema::table('bundle_payments', function (Blueprint $table): void {
                if (Schema::hasColumn('bundle_payments', 'bundle_id')) {
                    $table->renameColumn('bundle_id', 'package_id');
                }

                if (Schema::hasColumn('bundle_payments', 'bundle_enrollment_id')) {
                    $table->renameColumn('bundle_enrollment_id', 'package_enrollment_id');
                }
            });
        }

        if (Schema::hasTable('bundle_enrollments') && Schema::hasColumn('bundle_enrollments', 'bundle_id')) {
            Schema::table('bundle_enrollments', function (Blueprint $table): void {
                $table->renameColumn('bundle_id', 'package_id');
            });
        }

        if (Schema::hasTable('bundle_courses') && Schema::hasColumn('bundle_courses', 'bundle_id')) {
            Schema::table('bundle_courses', function (Blueprint $table): void {
                $table->renameColumn('bundle_id', 'package_id');
            });
        }

        if (Schema::hasTable('bundle_payments') && ! Schema::hasTable('package_payments')) {
            Schema::rename('bundle_payments', 'package_payments');
        }

        if (Schema::hasTable('bundle_enrollments') && ! Schema::hasTable('package_enrollments')) {
            Schema::rename('bundle_enrollments', 'package_enrollments');
        }

        if (Schema::hasTable('bundle_courses') && ! Schema::hasTable('package_courses')) {
            Schema::rename('bundle_courses', 'package_courses');
        }

        if (Schema::hasTable('bundles') && ! Schema::hasTable('packages')) {
            Schema::rename('bundles', 'packages');
        }
    }
};
