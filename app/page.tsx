"use client";

import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { httpGet } from "../helper/httpHelper";
import { User } from "@/interfaces/users";
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

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError(null);
      try {
        const data = await httpGet<User[]>(
          "https://api.evseg.store/api/v1/guide/admin/users"
          // "http://192.168.12.128:8081/api/v1/guide/admin/users"
        );
        setUsers(data || []);
      } catch (e: any) {
        setError(e.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  // Filtered and sorted users based on search and type filter
  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        const matchesSearch =
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone?.includes(searchTerm) ||
          user.plate_number?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === "all" || user.type === filterType;

        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        // First sort by reward amount (descending - highest first)
        const rewardA = a.reward_amount ?? 0;
        const rewardB = b.reward_amount ?? 0;

        if (rewardA !== rewardB) {
          return rewardB - rewardA;
        }

        // If reward amounts are equal, sort by onboarded status (onboarded first)
        const onboardedA = a.is_onboarded ? 1 : 0;
        const onboardedB = b.is_onboarded ? 1 : 0;

        return onboardedB - onboardedA;
      });
  }, [users, searchTerm, filterType]);

  // Statistics calculations
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.is_active).length;
    const onboardedUsers = users.filter((u) => u.is_onboarded).length;
    const recentLogins = users.filter((u) => {
      if (!u.last_login_at) return false;
      const loginDate = new Date(u.last_login_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return loginDate > weekAgo;
    }).length;

    const userTypes = users.reduce((acc, user) => {
      acc[user.type] = (acc[user.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalUsers,
      activeUsers,
      onboardedUsers,
      recentLogins,
      userTypes,
      activePercentage: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
      onboardedPercentage:
        totalUsers > 0 ? (onboardedUsers / totalUsers) * 100 : 0,
    };
  }, [users]);

  const userTypeOptions = Object.keys(stats.userTypes);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard Overview
            </h1>
            <p className="text-muted-foreground">
              Monitor and manage your guide network
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
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Guides
                    </CardTitle>
                    <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <svg
                        className="h-4 w-4 text-blue-600 dark:text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                        />
                      </svg>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.totalUsers}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Registered in system
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Guides
                    </CardTitle>
                    <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <svg
                        className="h-4 w-4 text-green-600 dark:text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {stats.activeUsers}
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <Progress
                        value={stats.activePercentage}
                        className="flex-1 h-2"
                      />
                      <span className="text-xs text-muted-foreground font-medium">
                        {stats.activePercentage.toFixed(1)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Onboarded
                    </CardTitle>
                    <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                      <svg
                        className="h-4 w-4 text-purple-600 dark:text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                        />
                      </svg>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.onboardedUsers}
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <Progress
                        value={stats.onboardedPercentage}
                        className="flex-1 h-2"
                      />
                      <span className="text-xs text-muted-foreground font-medium">
                        {stats.onboardedPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Recent Activity
                    </CardTitle>
                    <div className="h-8 w-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                      <svg
                        className="h-4 w-4 text-orange-600 dark:text-orange-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {stats.recentLogins}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Active in last 7 days
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* User Types Distribution */}
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
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <span>Guide Distribution by Type</span>
                  </CardTitle>
                  <CardDescription>
                    Breakdown of registered guides by their role and
                    specialization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(stats.userTypes).map(([type, count]) => (
                      <div
                        key={type}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Badge
                            variant="outline"
                            className="capitalize min-w-[100px] justify-center font-medium"
                          >
                            {type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {count} guide{count !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 min-w-[140px]">
                          <Progress
                            value={(count / stats.totalUsers) * 100}
                            className="flex-1 h-3"
                          />
                          <span className="text-xs text-muted-foreground font-medium min-w-[40px] text-right">
                            {((count / stats.totalUsers) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              {/* Search and Filter Controls */}
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
                    <span>Guide Management</span>
                  </CardTitle>
                  <CardDescription>
                    Search, filter, and manage registered guides in the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search by name, phone, or plate number..."
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
                        <option value="all">All Types</option>
                        {userTypeOptions.map((type) => (
                          <option
                            key={type}
                            value={type}
                            className="capitalize"
                          >
                            {type}
                          </option>
                        ))}
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
                      Showing <strong>{filteredUsers.length}</strong> of{" "}
                      <strong>{stats.totalUsers}</strong> guides
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {filteredUsers.length === stats.totalUsers
                        ? "All results"
                        : "Filtered"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Users Table */}
              {filteredUsers.length === 0 ? (
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
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-4h-2m2 0V6a2 2 0 00-2-2H6a2 2 0 00-2 2v3m16 0h-2M4 9h2"
                        />
                      </svg>
                      <p className="text-lg font-medium text-muted-foreground">
                        No guides found
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
                          Registered guides ({filteredUsers.length} shown)
                        </TableCaption>
                        <TableHeader>
                          <TableRow className="bg-gray-50 dark:bg-gray-800">
                            <TableHead className="font-semibold">
                              Guide
                            </TableHead>
                            <TableHead className="font-semibold">
                              Type
                            </TableHead>
                            <TableHead className="font-semibold">
                              Contact
                            </TableHead>
                            <TableHead className="font-semibold">
                              Commission
                            </TableHead>
                            <TableHead className="font-semibold">
                              Reward
                            </TableHead>
                            <TableHead className="font-semibold">
                              Vehicle
                            </TableHead>
                            <TableHead className="font-semibold">
                              Banking
                            </TableHead>
                            <TableHead className="font-semibold">
                              Status
                            </TableHead>
                            <TableHead className="font-semibold">
                              Last Active
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((user) => (
                            <TableRow
                              key={user.id}
                              className="hover:bg-muted/50"
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                                      {user.name?.[0]}
                                      {user.surname?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">
                                      {user.name} {user.surname}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      ID: {user.id}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="capitalize font-medium"
                                >
                                  {user.type || "N/A"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">
                                    {user.phone || "N/A"}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    RD: {user.rd || "N/A"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-green-600">
                                  {user.commission ?? "N/A"}%
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-green-600">
                                  {user.reward_amount ?? "N/A"}$
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">
                                    {user.plate_number || "N/A"}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {user.car_model || "N/A"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">
                                    {user.bank_name || "N/A"}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {user.bank_account || "N/A"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <Badge
                                    variant={
                                      user.is_active ? "default" : "outline"
                                    }
                                    className="text-xs"
                                  >
                                    {user.is_active ? "Active" : "Inactive"}
                                  </Badge>
                                  <br />
                                  <Badge
                                    variant={
                                      user.is_onboarded ? "default" : "outline"
                                    }
                                    className="text-xs"
                                  >
                                    {user.is_onboarded
                                      ? "Onboarded"
                                      : "Pending"}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs text-muted-foreground">
                                  {user.last_login_at
                                    ? formatDate(user.last_login_at)
                                    : "Never"}
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
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <span>Guide Activity</span>
                    </CardTitle>
                    <CardDescription>
                      Recent login activity and engagement metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <span className="text-sm font-medium">
                          Guides with recent activity
                        </span>
                        <Badge className="bg-blue-600">
                          {stats.recentLogins}
                        </Badge>
                      </div>
                      <Progress
                        value={(stats.recentLogins / stats.totalUsers) * 100}
                        className="h-3"
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        <strong>
                          {(
                            (stats.recentLogins / stats.totalUsers) *
                            100
                          ).toFixed(1)}
                          %
                        </strong>{" "}
                        of guides active in last 7 days
                      </p>
                    </div>
                  </CardContent>
                </Card>

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
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                      <span>Onboarding Progress</span>
                    </CardTitle>
                    <CardDescription>
                      Guide onboarding completion status and progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <span className="text-sm font-medium">
                          Completed onboarding
                        </span>
                        <Badge className="bg-green-600">
                          {stats.onboardedUsers}
                        </Badge>
                      </div>
                      <Progress
                        value={stats.onboardedPercentage}
                        className="h-3"
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        <strong>{stats.onboardedPercentage.toFixed(1)}%</strong>{" "}
                        completion rate across all guides
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

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
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <span>System Health Overview</span>
                  </CardTitle>
                  <CardDescription>
                    Overall system statistics and health indicators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-green-50 dark:bg-green-950 rounded-xl">
                      <div className="text-4xl font-bold text-green-600 mb-2">
                        {stats.activePercentage.toFixed(1)}%
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Active Rate
                      </p>
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        Excellent
                      </p>
                    </div>
                    <div className="text-center p-6 bg-blue-50 dark:bg-blue-950 rounded-xl">
                      <div className="text-4xl font-bold text-blue-600 mb-2">
                        {stats.onboardedPercentage.toFixed(1)}%
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Onboarding Rate
                      </p>
                      <p className="text-xs text-blue-600 mt-1 font-medium">
                        Good
                      </p>
                    </div>
                    <div className="text-center p-6 bg-purple-50 dark:bg-purple-950 rounded-xl">
                      <div className="text-4xl font-bold text-purple-600 mb-2">
                        {(
                          (stats.recentLogins / stats.totalUsers) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Weekly Engagement
                      </p>
                      <p className="text-xs text-purple-600 mt-1 font-medium">
                        {(stats.recentLogins / stats.totalUsers) * 100 > 30
                          ? "High"
                          : "Moderate"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
}
