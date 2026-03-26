<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexEnrollmentRequest;
use App\Http\Resources\EnrollmentResource;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class EnrollmentController extends Controller
{
    public function index(IndexEnrollmentRequest $request): JsonResponse
    {
        $status = $request->validated()['status'] ?? 'pending';

        $enrollments = Enrollment::with(['user', 'course'])
            ->where('status', $status)
            ->latest()
            ->get();

        return response()->json([
            'data' => EnrollmentResource::collection($enrollments),
        ]);
    }

    public function approve(Request $request, Enrollment $enrollment): JsonResponse
    {
        DB::transaction(function () use ($request, $enrollment): void {
            $enrollment->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => $request->user()->id,
            ]);

            $enrollment->payment()->update(['status' => 'success']);
        });

        return response()->json(['message' => 'Enrollment approved.']);
    }

    public function reject(Enrollment $enrollment): JsonResponse
    {
        DB::transaction(function () use ($enrollment): void {
            $enrollment->update(['status' => 'rejected']);
            $enrollment->payment()->update(['status' => 'failed']);
        });

        return response()->json(['message' => 'Enrollment rejected.']);
    }

    public function slip(Enrollment $enrollment)
    {
        if (! $enrollment->slip_image_path || ! Storage::disk('local')->exists($enrollment->slip_image_path)) {
            abort(404);
        }

        return Storage::disk('local')->response($enrollment->slip_image_path);
    }
}
