<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexBundleEnrollmentRequest;
use App\Http\Resources\BundleEnrollmentResource;
use App\Models\Enrollment;
use App\Models\BundleEnrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BundleEnrollmentController extends Controller
{
    public function index(IndexBundleEnrollmentRequest $request): JsonResponse
    {
        $status = $request->validated()['status'] ?? 'pending';

        $bundleEnrollments = BundleEnrollment::query()
            ->with(['user', 'bundle.courses', 'payment'])
            ->where('status', $status)
            ->latest()
            ->get();

        return response()->json([
            'data' => BundleEnrollmentResource::collection($bundleEnrollments),
        ]);
    }

    public function approve(\Illuminate\Http\Request $request, BundleEnrollment $bundleEnrollment): JsonResponse
    {
        DB::transaction(function () use ($request, $bundleEnrollment): void {
            $bundleEnrollment->loadMissing('bundle.courses');

            $bundleEnrollment->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => $request->user()->id,
            ]);

            $bundleEnrollment->payment()->update(['status' => 'success']);

            foreach ($bundleEnrollment->bundle->courses as $course) {
                Enrollment::updateOrCreate(
                    [
                        'user_id' => $bundleEnrollment->user_id,
                        'course_id' => $course->id,
                    ],
                    [
                        'status' => 'approved',
                        'approved_at' => now(),
                        'approved_by' => $request->user()->id,
                        'bundle_enrollment_id' => $bundleEnrollment->id,
                    ]
                );
            }
        });

        return response()->json(['message' => 'Bundle enrollment approved.']);
    }

    public function reject(BundleEnrollment $bundleEnrollment): JsonResponse
    {
        DB::transaction(function () use ($bundleEnrollment): void {
            $bundleEnrollment->update(['status' => 'rejected']);
            $bundleEnrollment->payment()->update(['status' => 'failed']);
        });

        return response()->json(['message' => 'Bundle enrollment rejected.']);
    }

    public function slip(BundleEnrollment $bundleEnrollment): StreamedResponse
    {
        if (! $bundleEnrollment->slip_image_path || ! Storage::disk('local')->exists($bundleEnrollment->slip_image_path)) {
            abort(404);
        }

        return Storage::disk('local')->response($bundleEnrollment->slip_image_path);
    }
}
