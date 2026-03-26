<?php

namespace App\Http\Controllers;

use App\Http\Resources\PackageResource;
use App\Models\Package;
use Illuminate\Http\JsonResponse;

class PackageController extends Controller
{
    public function index(): JsonResponse
    {
        $packages = Package::query()
            ->published()
            ->with('courses')
            ->latest()
            ->get();

        return response()->json([
            'data' => PackageResource::collection($packages),
        ]);
    }

    public function show(Package $package): JsonResponse
    {
        abort_unless($package->is_published, 404);

        $package->load('courses');

        return response()->json([
            'data' => new PackageResource($package),
        ]);
    }
}
