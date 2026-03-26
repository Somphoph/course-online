<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AddPackageCourseRequest;
use App\Http\Requests\Admin\StorePackageRequest;
use App\Http\Requests\Admin\UpdatePackageRequest;
use App\Http\Resources\PackageResource;
use App\Models\Course;
use App\Models\Package;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class PackageController extends Controller
{
    public function index(): JsonResponse
    {
        $packages = Package::query()
            ->with('courses')
            ->latest()
            ->get();

        return response()->json([
            'data' => PackageResource::collection($packages),
        ]);
    }

    public function store(StorePackageRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (! empty($data['is_published'])) {
            return response()->json([
                'message' => 'Bundle must have at least one course before publishing.',
            ], 422);
        }

        $package = Package::create($data);

        return response()->json([
            'data' => new PackageResource($package->load('courses')),
        ], 201);
    }

    public function update(UpdatePackageRequest $request, Package $package): JsonResponse
    {
        $data = $request->validated();

        if (array_key_exists('is_published', $data) && $data['is_published'] && $package->courses()->count() === 0) {
            return response()->json([
                'message' => 'Bundle must have at least one course before publishing.',
            ], 422);
        }

        $package->update($data);

        return response()->json([
            'data' => new PackageResource($package->fresh()->load('courses')),
        ]);
    }

    public function destroy(Package $package): JsonResponse|Response
    {
        $hasActiveEnrollments = $package->packageEnrollments()
            ->whereIn('status', ['pending', 'approved'])
            ->exists();

        if ($hasActiveEnrollments) {
            return response()->json([
                'message' => 'Cannot delete bundle with active enrollments.',
            ], 422);
        }

        $package->delete();

        return response()->noContent();
    }

    public function addCourse(AddPackageCourseRequest $request, Package $package): JsonResponse
    {
        $data = $request->validated();

        $package->courses()->syncWithoutDetaching([$data['course_id']]);

        return response()->json([
            'data' => new PackageResource($package->fresh()->load('courses')),
        ]);
    }

    public function removeCourse(Package $package, Course $course): JsonResponse|Response
    {
        $hasPendingEnrollments = $package->packageEnrollments()
            ->where('status', 'pending')
            ->exists();

        if ($hasPendingEnrollments) {
            return response()->json([
                'message' => 'Cannot remove course from bundle with pending enrollments.',
            ], 422);
        }

        $package->courses()->detach($course->id);

        return response()->noContent();
    }
}
