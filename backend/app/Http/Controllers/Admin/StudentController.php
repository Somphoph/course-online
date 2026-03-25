<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\StudentResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class StudentController extends Controller
{
    public function index(): JsonResponse
    {
        $students = User::query()
            ->where('role', 'student')
            ->withCount('enrollments')
            ->latest()
            ->get();

        return response()->json([
            'data' => StudentResource::collection($students),
        ]);
    }
}
