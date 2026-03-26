<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexPackageEnrollmentRequest;
use App\Http\Resources\PackageEnrollmentResource;
use App\Models\Enrollment;
use App\Models\PackageEnrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PackageEnrollmentController extends Controller
{
    public function index(IndexPackageEnrollmentRequest $request): JsonResponse
    {
        $status = $request->validated()['status'] ?? 'pending';

        $packageEnrollments = PackageEnrollment::query()
            ->with(['user', 'package.courses', 'payment'])
            ->where('status', $status)
            ->latest()
            ->get();

        return response()->json([
            'data' => PackageEnrollmentResource::collection($packageEnrollments),
        ]);
    }

    public function approve(\Illuminate\Http\Request $request, PackageEnrollment $packageEnrollment): JsonResponse
    {
        DB::transaction(function () use ($request, $packageEnrollment): void {
            $packageEnrollment->loadMissing('package.courses');

            $packageEnrollment->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => $request->user()->id,
            ]);

            $packageEnrollment->payment()->update(['status' => 'success']);

            foreach ($packageEnrollment->package->courses as $course) {
                Enrollment::create([
                    'user_id' => $packageEnrollment->user_id,
                    'course_id' => $course->id,
                    'status' => 'approved',
                    'approved_at' => now(),
                    'approved_by' => $request->user()->id,
                    'package_enrollment_id' => $packageEnrollment->id,
                ]);
            }
        });

        return response()->json(['message' => 'Package enrollment approved.']);
    }

    public function reject(PackageEnrollment $packageEnrollment): JsonResponse
    {
        DB::transaction(function () use ($packageEnrollment): void {
            $packageEnrollment->update(['status' => 'rejected']);
            $packageEnrollment->payment()->update(['status' => 'failed']);
        });

        return response()->json(['message' => 'Package enrollment rejected.']);
    }

    public function slip(PackageEnrollment $packageEnrollment): StreamedResponse
    {
        if (! $packageEnrollment->slip_image_path || ! Storage::disk('local')->exists($packageEnrollment->slip_image_path)) {
            abort(404);
        }

        return Storage::disk('local')->response($packageEnrollment->slip_image_path);
    }
}
