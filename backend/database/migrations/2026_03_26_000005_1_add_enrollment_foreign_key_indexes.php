<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('enrollments')) {
            return;
        }

        $needsUserIndex = ! $this->hasIndex('enrollments', 'enrollments_user_id_index');
        $needsCourseIndex = ! $this->hasIndex('enrollments', 'enrollments_course_id_index');

        if (! $needsUserIndex && ! $needsCourseIndex) {
            return;
        }

        Schema::table('enrollments', function (Blueprint $table) use ($needsUserIndex, $needsCourseIndex): void {
            if ($needsUserIndex) {
                $table->index('user_id', 'enrollments_user_id_index');
            }

            if ($needsCourseIndex) {
                $table->index('course_id', 'enrollments_course_id_index');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('enrollments')) {
            return;
        }

        $hasUserIndex = $this->hasIndex('enrollments', 'enrollments_user_id_index');
        $hasCourseIndex = $this->hasIndex('enrollments', 'enrollments_course_id_index');

        if (! $hasUserIndex && ! $hasCourseIndex) {
            return;
        }

        Schema::table('enrollments', function (Blueprint $table) use ($hasUserIndex, $hasCourseIndex): void {
            if ($hasUserIndex) {
                $table->dropIndex('enrollments_user_id_index');
            }

            if ($hasCourseIndex) {
                $table->dropIndex('enrollments_course_id_index');
            }
        });
    }

    private function hasIndex(string $table, string $index): bool
    {
        return match (DB::getDriverName()) {
            'mysql' => ! empty(DB::select('SHOW INDEX FROM `' . $table . '` WHERE Key_name = ?', [$index])),
            'pgsql' => DB::table('pg_indexes')
                ->where('schemaname', 'public')
                ->where('tablename', $table)
                ->where('indexname', $index)
                ->exists(),
            'sqlite' => collect(DB::select("PRAGMA index_list('$table')"))
                ->contains(fn (object $row) => ($row->name ?? null) === $index),
            default => false,
        };
    }
};
