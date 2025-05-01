import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, CreditCard, Calendar, CheckCircle2, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function TutorEarnings() {
  const session = await auth();
  if (!session) return null;

  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Earnings</h1>
            <p className="text-gray-400 mt-2">
              Track your revenue and payment history
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="bg-[#141414] border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white">
                  Total Earnings
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">$12,458</div>
                <p className="text-xs text-green-400 mt-1">Lifetime earnings</p>
              </CardContent>
            </Card>

            <Card className="bg-[#141414] border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white">
                  Monthly Revenue
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">$2,845</div>
                <p className="text-xs text-blue-400 mt-1">+18% from last month</p>
              </CardContent>
            </Card>

            <Card className="bg-[#141414] border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white">
                  Pending Payout
                </CardTitle>
                <Clock className="h-4 w-4 text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">$965</div>
                <p className="text-xs text-orange-400 mt-1">Processing</p>
              </CardContent>
            </Card>

            <Card className="bg-[#141414] border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white">
                  Available Balance
                </CardTitle>
                <CreditCard className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">$1,234</div>
                <p className="text-xs text-purple-400 mt-1">Ready to withdraw</p>
              </CardContent>
            </Card>
          </div>

          {/* Course Revenue */}
          <Card className="bg-[#141414] border-gray-800 mb-8">
            <CardHeader>
              <CardTitle className="text-lg text-white">Revenue by Course</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Python Masterclass */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-white">Python Programming Masterclass</span>
                    <span className="text-sm text-green-400">$5,678</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full">
                    <div className="h-2 bg-green-500 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-400">
                    <span>892 sales</span>
                    <span>45% of total revenue</span>
                  </div>
                </div>

                {/* Web Development */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-white">Web Development Bootcamp</span>
                    <span className="text-sm text-green-400">$4,230</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full">
                    <div className="h-2 bg-green-500 rounded-full" style={{ width: '35%' }}></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-400">
                    <span>654 sales</span>
                    <span>35% of total revenue</span>
                  </div>
                </div>

                {/* Machine Learning */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-white">Machine Learning Fundamentals</span>
                    <span className="text-sm text-green-400">$2,550</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full">
                    <div className="h-2 bg-green-500 rounded-full" style={{ width: '20%' }}></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-400">
                    <span>423 sales</span>
                    <span>20% of total revenue</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card className="bg-[#141414] border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg text-white">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800">
                    <TableHead className="text-gray-400">Date</TableHead>
                    <TableHead className="text-gray-400">Amount</TableHead>
                    <TableHead className="text-gray-400">Method</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-gray-800">
                    <TableCell className="text-white">Apr 25, 2025</TableCell>
                    <TableCell className="text-white">$1,245.00</TableCell>
                    <TableCell className="text-white">Bank Transfer</TableCell>
                    <TableCell className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span className="text-green-400">Completed</span>
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-gray-800">
                    <TableCell className="text-white">Mar 25, 2025</TableCell>
                    <TableCell className="text-white">$2,150.00</TableCell>
                    <TableCell className="text-white">PayPal</TableCell>
                    <TableCell className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span className="text-green-400">Completed</span>
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-gray-800">
                    <TableCell className="text-white">Feb 25, 2025</TableCell>
                    <TableCell className="text-white">$1,875.00</TableCell>
                    <TableCell className="text-white">Bank Transfer</TableCell>
                    <TableCell className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span className="text-green-400">Completed</span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}