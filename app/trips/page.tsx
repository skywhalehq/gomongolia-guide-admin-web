"use client";

import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { httpGet } from "../../helper/httpHelper";
import { User } from "@/interfaces/users";
import { Trip } from "@/interfaces/trips";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdminLayout } from "@/components/admin-layout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Client-only time component to prevent hydration mismatch
function ClientTime() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Badge variant="outline" className="text-sm">
        Last updated: Loading...
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-sm">
      Last updated: {new Date().toLocaleTimeString()}
    </Badge>
  );
}

// Safe date formatter to prevent hydration issues
function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return "Invalid date";
  }
}

export default function Trips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [activeTab, setActiveTab] = useState("trips");
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchTrips() {
      setLoading(true);
      setError(null);
      try {
        const response = await httpGet<Trip[]>(
          //   "https://api.evseg.store/api/v1/guide/admin/trips"
          "http://192.168.12.128:8081/api/v1/guide/admin/trips"
        );
        setTrips(response || []);
      } catch (e: any) {
        setError(e.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchTrips();
  }, []);

  // Filtered trips based on search and type filter
  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      const matchesSearch =
        trip.guide?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.guide?.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.driver?.surname
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        trip.guide?.phone?.includes(searchTerm) ||
        trip.driver?.phone?.includes(searchTerm) ||
        trip.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.company?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        filterType === "all" ||
        (filterType === "finished" && trip.is_finished) ||
        (filterType === "cancelled" && trip.is_cancelled) ||
        (filterType === "active" && !trip.is_finished && !trip.is_cancelled);

      return matchesSearch && matchesType;
    });
  }, [trips, searchTerm, filterType]);

  // User type options for filtering (collect unique types from guides)
  const userTypeOptions = useMemo(() => {
    const guides: User[] = trips
      .map((trip) => trip.guide)
      .filter((g): g is User => !!g);

    // Deduplicate users by ID first, then get unique types
    const uniqueGuides = guides.filter(
      (guide, index, self) => index === self.findIndex((g) => g.id === guide.id)
    );

    return Array.from(new Set(uniqueGuides.map((g) => g.type || "unknown")));
  }, [trips]);

  // Filtered users (guides) for the Users tab
  const filteredUsers = useMemo(() => {
    // Get all guides from trips and deduplicate by ID
    const guides: User[] = trips
      .map((trip) => trip.guide)
      .filter((g): g is User => !!g);

    // Deduplicate users by ID
    const uniqueGuides = guides.filter(
      (guide, index, self) => index === self.findIndex((g) => g.id === guide.id)
    );

    return uniqueGuides.filter((user) => {
      const matchesSearch =
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm) ||
        user.plate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.car_model?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        filterType === "all" || (user.type || "unknown") === filterType;

      return matchesSearch && matchesType;
    });
  }, [trips, searchTerm, filterType]);

  // Statistics calculations
  const stats = useMemo(() => {
    const totalTrips = trips.length;
    const finishedTrips = trips.filter((t) => t.is_finished).length;
    const cancelledTrips = trips.filter((t) => t.is_cancelled).length;
    const activeTrips = trips.filter(
      (t) => !t.is_finished && !t.is_cancelled
    ).length;

    // Collect unique guides and drivers
    const allGuides = new Set<number>();
    const allDrivers = new Set<number>();

    trips.forEach((trip) => {
      if (trip.guide) allGuides.add(trip.guide.id);
      if (trip.driver) allDrivers.add(trip.driver.id);
    });

    const tripStatuses = trips.reduce((acc, trip) => {
      if (trip.is_finished) {
        acc.finished = (acc.finished || 0) + 1;
      } else if (trip.is_cancelled) {
        acc.cancelled = (acc.cancelled || 0) + 1;
      } else {
        acc.active = (acc.active || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const totalAmount = trips.reduce(
      (sum, trip) => sum + (trip.total_amount || 0),
      0
    );

    // Additional stats for guides/users
    // Gather all guides from trips and deduplicate by ID
    const guides: User[] = trips
      .map((trip) => trip.guide)
      .filter((g): g is User => !!g);

    // Deduplicate users by ID
    const uniqueGuides = guides.filter(
      (guide, index, self) => index === self.findIndex((g) => g.id === guide.id)
    );

    const totalUsers = uniqueGuides.length;
    const activeUsers = uniqueGuides.filter((g) => g.is_active).length;
    const onboardedUsers = uniqueGuides.filter((g) => g.is_onboarded).length;
    const recentLogins = uniqueGuides.filter((g) => {
      if (!g.last_login_at) return false;
      const lastLogin = new Date(g.last_login_at);
      const now = new Date();
      const diff =
        (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    }).length;

    // User types distribution
    const userTypes: Record<string, number> = {};
    uniqueGuides.forEach((g) => {
      const type = g.type || "unknown";
      userTypes[type] = (userTypes[type] || 0) + 1;
    });

    return {
      totalTrips,
      finishedTrips,
      cancelledTrips,
      activeTrips,
      totalGuides: allGuides.size,
      totalDrivers: allDrivers.size,
      tripStatuses,
      totalAmount,
      finishedPercentage:
        totalTrips > 0 ? (finishedTrips / totalTrips) * 100 : 0,
      cancelledPercentage:
        totalTrips > 0 ? (cancelledTrips / totalTrips) * 100 : 0,
      // Added fields for dashboard
      totalUsers,
      activeUsers,
      onboardedUsers,
      recentLogins,
      userTypes,
      activePercentage: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
      onboardedPercentage:
        totalUsers > 0 ? (onboardedUsers / totalUsers) * 100 : 0,
    };
  }, [trips]);

  const handleRowClick = (trip: Trip) => {
    setSelectedTrip(trip);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTrip(null);
  };

  const statusOptions = Object.keys(stats.tripStatuses);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Trips Management
            </h1>
            <p className="text-muted-foreground">
              Monitor and manage all trips in the system
            </p>
          </div>
          <ClientTime />
        </div>

        {/* Loading and Error States */}
        {loading && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-muted-foreground">
                  Loading dashboard data...
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>Error loading data: {error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <svg
                    className="h-5 w-5 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>Trip Management</span>
                </CardTitle>
                <CardDescription>
                  Search, filter, and manage all trips in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by trip code, guide name, company..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-3 py-2 border border-input rounded-md bg-background text-sm min-w-[120px]"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="finished">Finished</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setFilterType("all");
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing <strong>{filteredTrips.length}</strong> of{" "}
                    <strong>{stats.totalTrips}</strong> trips
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {filteredTrips.length === stats.totalTrips
                      ? "All results"
                      : "Filtered"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Trips Table */}
            {filteredTrips.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center space-y-3">
                    <svg
                      className="mx-auto h-12 w-12 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM21 17a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"
                      />
                    </svg>
                    <p className="text-lg font-medium text-muted-foreground">
                      No trips found
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search criteria or filters
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto table-container">
                    <Table>
                      <TableCaption className="text-muted-foreground">
                        All trips ({filteredTrips.length} shown)
                      </TableCaption>
                      <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-gray-800">
                          <TableHead className="font-semibold">
                            Trip Code
                          </TableHead>
                          <TableHead className="font-semibold">Guide</TableHead>
                          <TableHead className="font-semibold">
                            Driver
                          </TableHead>
                          <TableHead className="font-semibold">
                            Company
                          </TableHead>
                          <TableHead className="font-semibold">
                            Amount
                          </TableHead>
                          <TableHead className="font-semibold">
                            Tourists
                          </TableHead>
                          <TableHead className="font-semibold">
                            Status
                          </TableHead>
                          <TableHead className="font-semibold">
                            Expires
                          </TableHead>
                          <TableHead className="font-semibold">
                            Created
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTrips.map((trip, index) => (
                          <TableRow
                            key={`trip-${trip.id}-${index}`}
                            className="hover:bg-muted/50 cursor-pointer"
                            onClick={() => handleRowClick(trip)}
                          >
                            <TableCell>
                              <div className="font-medium text-primary">
                                {trip.code}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ID: {trip.id}
                              </div>
                            </TableCell>
                            <TableCell>
                              {trip.guide ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs bg-blue-100 text-blue-800">
                                      {trip.guide.name?.[0]}
                                      {trip.guide.surname?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-sm">
                                      {trip.guide.name} {trip.guide.surname}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {trip.guide.phone}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">
                                  No guide
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {trip.driver ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs bg-green-100 text-green-800">
                                      {trip.driver.name?.[0]}
                                      {trip.driver.surname?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-sm">
                                      {trip.driver.name} {trip.driver.surname}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {trip.driver.phone}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">
                                  No driver
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {trip.company ? (
                                <div>
                                  <div className="font-medium text-sm">
                                    {trip.company.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {trip.company.code}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">
                                  No company
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-green-600">
                                ${(trip.total_amount || 0).toLocaleString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {trip.tourists && trip.tourists.length > 0 ? (
                                  <div>
                                    <div className="font-medium">
                                      {trip.tourists.reduce(
                                        (sum, tourist) =>
                                          sum + tourist.male + tourist.female,
                                        0
                                      )}{" "}
                                      people
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {trip.tourists.reduce(
                                        (sum, tourist) => sum + tourist.male,
                                        0
                                      )}
                                      M /{" "}
                                      {trip.tourists.reduce(
                                        (sum, tourist) => sum + tourist.female,
                                        0
                                      )}
                                      F
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">
                                    No tourists
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  trip.is_finished
                                    ? "default"
                                    : trip.is_cancelled
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {trip.is_finished
                                  ? "Finished"
                                  : trip.is_cancelled
                                  ? "Cancelled"
                                  : "Active"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs text-muted-foreground">
                                {trip.expires_at
                                  ? formatDate(trip.expires_at)
                                  : "No expiry"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(trip.created_at)}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Trip Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Trip Details - {selectedTrip?.code}
              </DialogTitle>
              <DialogDescription>
                Complete information about this trip
              </DialogDescription>
            </DialogHeader>

            {selectedTrip && (
              <div className="space-y-6">
                {/* Basic Trip Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Trip Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Trip Code
                      </label>
                      <p className="font-medium text-primary">
                        {selectedTrip.code}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Trip ID
                      </label>
                      <p className="font-medium">{selectedTrip.id}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Total Amount
                      </label>
                      <p className="font-medium text-green-600 text-lg">
                        ${(selectedTrip.total_amount || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Status
                      </label>
                      <Badge
                        variant={
                          selectedTrip.is_finished
                            ? "default"
                            : selectedTrip.is_cancelled
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {selectedTrip.is_finished
                          ? "Finished"
                          : selectedTrip.is_cancelled
                          ? "Cancelled"
                          : "Active"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Created
                      </label>
                      <p className="font-medium">
                        {formatDate(selectedTrip.created_at)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Expires
                      </label>
                      <p className="font-medium">
                        {selectedTrip.expires_at
                          ? formatDate(selectedTrip.expires_at)
                          : "No expiry"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Guide Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Guide Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedTrip.guide ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 md:col-span-2">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="text-lg bg-blue-100 text-blue-800">
                              {selectedTrip.guide.name?.[0]}
                              {selectedTrip.guide.surname?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-lg">
                              {selectedTrip.guide.name}{" "}
                              {selectedTrip.guide.surname}
                            </p>
                            <p className="text-muted-foreground">
                              {selectedTrip.guide.phone}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Guide ID
                          </label>
                          <p className="font-medium">{selectedTrip.guide.id}</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Type
                          </label>
                          <p className="font-medium">
                            {selectedTrip.guide.type || "Unknown"}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Active
                          </label>
                          <Badge
                            variant={
                              selectedTrip.guide.is_active
                                ? "default"
                                : "secondary"
                            }
                          >
                            {selectedTrip.guide.is_active
                              ? "Active"
                              : "Inactive"}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Onboarded
                          </label>
                          <Badge
                            variant={
                              selectedTrip.guide.is_onboarded
                                ? "default"
                                : "secondary"
                            }
                          >
                            {selectedTrip.guide.is_onboarded
                              ? "Onboarded"
                              : "Not Onboarded"}
                          </Badge>
                        </div>
                        {selectedTrip.guide.last_login_at && (
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-muted-foreground">
                              Last Login
                            </label>
                            <p className="font-medium">
                              {formatDate(selectedTrip.guide.last_login_at)}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No guide assigned</p>
                    )}
                  </CardContent>
                </Card>

                {/* Driver Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Driver Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedTrip.driver ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 md:col-span-2">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="text-lg bg-green-100 text-green-800">
                              {selectedTrip.driver.name?.[0]}
                              {selectedTrip.driver.surname?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-lg">
                              {selectedTrip.driver.name}{" "}
                              {selectedTrip.driver.surname}
                            </p>
                            <p className="text-muted-foreground">
                              {selectedTrip.driver.phone}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Driver ID
                          </label>
                          <p className="font-medium">
                            {selectedTrip.driver.id}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Type
                          </label>
                          <p className="font-medium">
                            {selectedTrip.driver.type || "Unknown"}
                          </p>
                        </div>
                        {selectedTrip.driver.plate_number && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                              Plate Number
                            </label>
                            <p className="font-medium">
                              {selectedTrip.driver.plate_number}
                            </p>
                          </div>
                        )}
                        {selectedTrip.driver.car_model && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                              Car Model
                            </label>
                            <p className="font-medium">
                              {selectedTrip.driver.car_model}
                            </p>
                          </div>
                        )}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Active
                          </label>
                          <Badge
                            variant={
                              selectedTrip.driver.is_active
                                ? "default"
                                : "secondary"
                            }
                          >
                            {selectedTrip.driver.is_active
                              ? "Active"
                              : "Inactive"}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Onboarded
                          </label>
                          <Badge
                            variant={
                              selectedTrip.driver.is_onboarded
                                ? "default"
                                : "secondary"
                            }
                          >
                            {selectedTrip.driver.is_onboarded
                              ? "Onboarded"
                              : "Not Onboarded"}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        No driver assigned
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Company Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Company Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedTrip.company ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Company Name
                          </label>
                          <p className="font-semibold text-lg">
                            {selectedTrip.company.name}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Company Code
                          </label>
                          <p className="font-medium">
                            {selectedTrip.company.code}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            English Name
                          </label>
                          <p className="font-medium">
                            {selectedTrip.company.name_en}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Phone
                          </label>
                          <p className="font-medium">
                            {selectedTrip.company.phone}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Company ID
                          </label>
                          <p className="font-medium">
                            {selectedTrip.company.id}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        No company assigned
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Tourists Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Tourists Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedTrip.tourists &&
                    selectedTrip.tourists.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">
                              {selectedTrip.tourists.reduce(
                                (sum, tourist) =>
                                  sum + tourist.male + tourist.female,
                                0
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Total People
                            </p>
                          </div>
                          <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">
                              {selectedTrip.tourists.reduce(
                                (sum, tourist) => sum + tourist.male,
                                0
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Male
                            </p>
                          </div>
                          <div className="text-center p-4 bg-pink-50 dark:bg-pink-950 rounded-lg">
                            <p className="text-2xl font-bold text-pink-600">
                              {selectedTrip.tourists.reduce(
                                (sum, tourist) => sum + tourist.female,
                                0
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Female
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h4 className="font-semibold">Tourist Groups:</h4>
                          {selectedTrip.tourists.map((tourist, index) => (
                            <div
                              key={tourist.id}
                              className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800"
                            >
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <label className="text-muted-foreground">
                                    Group ID
                                  </label>
                                  <p className="font-medium">{tourist.id}</p>
                                </div>
                                <div>
                                  <label className="text-muted-foreground">
                                    Country ID
                                  </label>
                                  <p className="font-medium">
                                    {tourist.country_id}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-muted-foreground">
                                    Male
                                  </label>
                                  <p className="font-medium">{tourist.male}</p>
                                </div>
                                <div>
                                  <label className="text-muted-foreground">
                                    Female
                                  </label>
                                  <p className="font-medium">
                                    {tourist.female}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        No tourists information available
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Additional Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Additional Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Store ID
                      </label>
                      <p className="font-medium">{selectedTrip.store_id}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
