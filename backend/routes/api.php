<?php

use App\Http\Controllers\Admin\CourseController as AdminCourseController;
use App\Http\Controllers\Admin\EnrollmentController as AdminEnrollmentController;
use App\Http\Controllers\Admin\LessonController as AdminLessonController;
use App\Http\Controllers\Admin\StudentController as AdminStudentController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\LessonVideoController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register'])->middleware('throttle:5,1');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('reset-password', [AuthController::class, 'resetPassword']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

Route::get('courses', [CourseController::class, 'index']);
Route::get('courses/{course:slug}', [CourseController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('user', function (Request $request) {
        return $request->user();
    });

    Route::get('enrollments', [EnrollmentController::class, 'index']);
    Route::post('enrollments', [EnrollmentController::class, 'store']);
    Route::get('lessons/{lesson}/video-url', [LessonVideoController::class, 'show']);
});

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::apiResource('courses', AdminCourseController::class)->except(['show']);
    Route::get('courses/{course}/lessons', [AdminLessonController::class, 'index']);
    Route::post('courses/{course}/lessons', [AdminLessonController::class, 'store']);
    Route::put('lessons/{lesson}', [AdminLessonController::class, 'update']);
    Route::delete('lessons/{lesson}', [AdminLessonController::class, 'destroy']);

    Route::get('enrollments', [AdminEnrollmentController::class, 'index']);
    Route::post('enrollments/{enrollment}/approve', [AdminEnrollmentController::class, 'approve']);
    Route::post('enrollments/{enrollment}/reject', [AdminEnrollmentController::class, 'reject']);
    Route::get('enrollments/{enrollment}/slip', [AdminEnrollmentController::class, 'slip']);

    Route::get('students', [AdminStudentController::class, 'index']);
});
