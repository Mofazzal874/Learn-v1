'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  CreditCard, 
  Smartphone, 
  Building2,
  Loader2,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from 'next/navigation';

interface EnrollmentFormProps {
  course: {
    _id: string;
    title: string;
    isFree: boolean;
  };
  userId?: string;
  finalPrice: number;
}

type PaymentMethod = 'visa' | 'mastercard' | 'mobile' | 'bank_transfer';

export default function EnrollmentForm({ course, userId, finalPrice }: EnrollmentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('visa');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Card details
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    
    // Mobile banking
    mobileNumber: '',
    mobilePin: '',
    
    // Bank transfer
    accountNumber: '',
    routingNumber: '',
    
    // Billing info
    billingName: '',
    billingEmail: '',
    billingAddress: '',
    city: '',
    postalCode: '',
    country: 'US'
  });

  const router = useRouter();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    // Add spaces every 4 digits
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.slice(0, 19); // Max 16 digits + 3 spaces
  };

  const formatExpiryDate = (value: string) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    // Add slash after 2 digits
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const validateForm = () => {
    if (course.isFree) {
      return true; // No payment validation needed for free courses
    }

    if (!formData.billingName || !formData.billingEmail) {
      toast.error('Please fill in your billing information');
      return false;
    }

    switch (paymentMethod) {
      case 'visa':
      case 'mastercard':
        if (!formData.cardNumber || !formData.expiryDate || !formData.cvv || !formData.cardName) {
          toast.error('Please fill in all card details');
          return false;
        }
        if (formData.cardNumber.replace(/\s/g, '').length < 16) {
          toast.error('Please enter a valid card number');
          return false;
        }
        if (formData.cvv.length < 3) {
          toast.error('Please enter a valid CVV');
          return false;
        }
        break;
      case 'mobile':
        if (!formData.mobileNumber || !formData.mobilePin) {
          toast.error('Please fill in mobile banking details');
          return false;
        }
        break;
      case 'bank_transfer':
        if (!formData.accountNumber || !formData.routingNumber) {
          toast.error('Please fill in bank transfer details');
          return false;
        }
        break;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Call enrollment API
      const response = await fetch('/api/courses/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: course._id,
          userId,
          paymentMethod,
          amount: finalPrice,
          paymentDetails: course.isFree ? null : {
            method: paymentMethod,
            billingInfo: {
              name: formData.billingName,
              email: formData.billingEmail,
              address: formData.billingAddress,
              city: formData.city,
              postalCode: formData.postalCode,
              country: formData.country
            }
          }
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Enrollment failed');
      }

      toast.success('Successfully enrolled in the course!');
      
      // Redirect to course or dashboard
      router.push(`/courses/${course._id}?enrolled=true`);
      
    } catch (error: any) {
      console.error('Enrollment error:', error);
      toast.error(error.message || 'Failed to enroll in course. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (course.isFree) {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center py-8">
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Free Course Enrollment</h3>
          <p className="text-gray-400 mb-6">
            You&apos;re about to enroll in this free course. Click confirm to start learning!
          </p>
        </div>

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enrolling...
            </>
          ) : (
            'Confirm Enrollment'
          )}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Method Selection */}
      <div>
        <Label className="text-white mb-3 block">Payment Method</Label>
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant={paymentMethod === 'visa' ? 'default' : 'outline'}
            className={`p-4 h-auto ${paymentMethod === 'visa' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-800 hover:bg-gray-800'}`}
            onClick={() => setPaymentMethod('visa')}
          >
            <div className="flex flex-col items-center gap-2">
              <CreditCard className="h-6 w-6" />
              <span className="text-sm">Visa</span>
            </div>
          </Button>
          <Button
            type="button"
            variant={paymentMethod === 'mastercard' ? 'default' : 'outline'}
            className={`p-4 h-auto ${paymentMethod === 'mastercard' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-800 hover:bg-gray-800'}`}
            onClick={() => setPaymentMethod('mastercard')}
          >
            <div className="flex flex-col items-center gap-2">
              <CreditCard className="h-6 w-6" />
              <span className="text-sm">Mastercard</span>
            </div>
          </Button>
          <Button
            type="button"
            variant={paymentMethod === 'mobile' ? 'default' : 'outline'}
            className={`p-4 h-auto ${paymentMethod === 'mobile' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-800 hover:bg-gray-800'}`}
            onClick={() => setPaymentMethod('mobile')}
          >
            <div className="flex flex-col items-center gap-2">
              <Smartphone className="h-6 w-6" />
              <span className="text-sm">Mobile Banking</span>
            </div>
          </Button>
          <Button
            type="button"
            variant={paymentMethod === 'bank_transfer' ? 'default' : 'outline'}
            className={`p-4 h-auto ${paymentMethod === 'bank_transfer' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-800 hover:bg-gray-800'}`}
            onClick={() => setPaymentMethod('bank_transfer')}
          >
            <div className="flex flex-col items-center gap-2">
              <Building2 className="h-6 w-6" />
              <span className="text-sm">Bank Transfer</span>
            </div>
          </Button>
        </div>
      </div>

      {/* Payment Details */}
      {(paymentMethod === 'visa' || paymentMethod === 'mastercard') && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="cardNumber" className="text-white">Card Number</Label>
            <Input
              id="cardNumber"
              type="text"
              placeholder="1234 5678 9012 3456"
              value={formData.cardNumber}
              onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
              className="mt-2 bg-[#0a0a0a] border-gray-800 text-white"
              maxLength={19}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiryDate" className="text-white">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="text"
                placeholder="MM/YY"
                value={formData.expiryDate}
                onChange={(e) => handleInputChange('expiryDate', formatExpiryDate(e.target.value))}
                className="mt-2 bg-[#0a0a0a] border-gray-800 text-white"
                maxLength={5}
              />
            </div>
            <div>
              <Label htmlFor="cvv" className="text-white">CVV</Label>
              <Input
                id="cvv"
                type="text"
                placeholder="123"
                value={formData.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="mt-2 bg-[#0a0a0a] border-gray-800 text-white"
                maxLength={4}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="cardName" className="text-white">Name on Card</Label>
            <Input
              id="cardName"
              type="text"
              placeholder="John Doe"
              value={formData.cardName}
              onChange={(e) => handleInputChange('cardName', e.target.value)}
              className="mt-2 bg-[#0a0a0a] border-gray-800 text-white"
            />
          </div>
        </div>
      )}

      {paymentMethod === 'mobile' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="mobileNumber" className="text-white">Mobile Number</Label>
            <Input
              id="mobileNumber"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.mobileNumber}
              onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
              className="mt-2 bg-[#0a0a0a] border-gray-800 text-white"
            />
          </div>
          <div>
            <Label htmlFor="mobilePin" className="text-white">Mobile Banking PIN</Label>
            <Input
              id="mobilePin"
              type="password"
              placeholder="Enter your mobile banking PIN"
              value={formData.mobilePin}
              onChange={(e) => handleInputChange('mobilePin', e.target.value)}
              className="mt-2 bg-[#0a0a0a] border-gray-800 text-white"
            />
          </div>
        </div>
      )}

      {paymentMethod === 'bank_transfer' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="accountNumber" className="text-white">Account Number</Label>
            <Input
              id="accountNumber"
              type="text"
              placeholder="123456789012"
              value={formData.accountNumber}
              onChange={(e) => handleInputChange('accountNumber', e.target.value)}
              className="mt-2 bg-[#0a0a0a] border-gray-800 text-white"
            />
          </div>
          <div>
            <Label htmlFor="routingNumber" className="text-white">Routing Number</Label>
            <Input
              id="routingNumber"
              type="text"
              placeholder="021000021"
              value={formData.routingNumber}
              onChange={(e) => handleInputChange('routingNumber', e.target.value)}
              className="mt-2 bg-[#0a0a0a] border-gray-800 text-white"
            />
          </div>
        </div>
      )}

      {/* Billing Information */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Billing Information</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="billingName" className="text-white">Full Name</Label>
              <Input
                id="billingName"
                type="text"
                placeholder="John Doe"
                value={formData.billingName}
                onChange={(e) => handleInputChange('billingName', e.target.value)}
                className="mt-2 bg-[#0a0a0a] border-gray-800 text-white"
              />
            </div>
            <div>
              <Label htmlFor="billingEmail" className="text-white">Email</Label>
              <Input
                id="billingEmail"
                type="email"
                placeholder="john@example.com"
                value={formData.billingEmail}
                onChange={(e) => handleInputChange('billingEmail', e.target.value)}
                className="mt-2 bg-[#0a0a0a] border-gray-800 text-white"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="billingAddress" className="text-white">Address</Label>
            <Input
              id="billingAddress"
              type="text"
              placeholder="123 Main St"
              value={formData.billingAddress}
              onChange={(e) => handleInputChange('billingAddress', e.target.value)}
              className="mt-2 bg-[#0a0a0a] border-gray-800 text-white"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city" className="text-white">City</Label>
              <Input
                id="city"
                type="text"
                placeholder="New York"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="mt-2 bg-[#0a0a0a] border-gray-800 text-white"
              />
            </div>
            <div>
              <Label htmlFor="postalCode" className="text-white">Postal Code</Label>
              <Input
                id="postalCode"
                type="text"
                placeholder="10001"
                value={formData.postalCode}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                className="mt-2 bg-[#0a0a0a] border-gray-800 text-white"
              />
            </div>
            <div>
              <Label htmlFor="country" className="text-white">Country</Label>
              <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                <SelectTrigger className="mt-2 bg-[#0a0a0a] border-gray-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-gray-800">
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="UK">United Kingdom</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="IN">India</SelectItem>
                  <SelectItem value="BD">Bangladesh</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Total and Submit */}
      <div className="border-t border-gray-800 pt-6">
        <div className="flex justify-between items-center mb-6">
          <span className="text-lg text-gray-400">Total Amount:</span>
          <span className="text-2xl font-bold text-white">${finalPrice}</span>
        </div>
        
        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Payment...
            </>
          ) : (
            `Confirm Enrollment - $${finalPrice}`
          )}
        </Button>
      </div>
    </form>
  );
}