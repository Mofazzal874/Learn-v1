'use client';

import { useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DollarSign, Gift, Calendar, ArrowRight } from "lucide-react";

interface PricingData {
  basePrice: string;
  hasDiscount: boolean;
  discountPrice: string;
  discountEnds: string;
  isFree: boolean;
}

interface PricingFormProps {
  onSave: (data: PricingData) => void;
  onBack: () => void;
  onNext: () => void;
  initialData?: PricingData;
}

export default function PricingForm({ onSave, onBack, onNext, initialData }: PricingFormProps) {
  const [formData, setFormData] = useState<PricingData>(initialData || {
    basePrice: '',
    hasDiscount: false,
    discountPrice: '',
    discountEnds: '',
    isFree: false,
  });

  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = useMemo(() => {
   
    if (formData.isFree) {
      return true;
    }

    
    const basePriceValid = parseFloat(formData.basePrice) > 0;

    if (formData.hasDiscount) {
      const discountPriceValid = parseFloat(formData.discountPrice) > 0;
      const discountEndsValid = formData.discountEnds.trim().length > 0;
      return basePriceValid && discountPriceValid && discountEndsValid;
    }

    return basePriceValid;
  }, [formData]);


  const handleInputChange = (field: keyof PricingData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // If course is marked as free, reset other pricing fields
      if (field === 'isFree' && value === true) {
        newData.basePrice = '0';
        newData.hasDiscount = false;
        newData.discountPrice = '';
        newData.discountEnds = '';
      }

      return newData;
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onSave(formData);
      onNext();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-[#141414] border-gray-800 max-w-4xl mx-auto">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">Course Pricing</h2>
          <p className="text-gray-400">Set your course price and payment options</p>
        </div>

        <div className="space-y-8">
          {/* Free Course Option */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Free Course</Label>
                <p className="text-sm text-gray-400">Offer your course for free</p>
              </div>
              <Switch
                checked={formData.isFree}
                onCheckedChange={(checked) => handleInputChange('isFree', checked)}
              />
            </div>
          </div>

          {/* Base Price */}
          {!formData.isFree && (
            <div>
              <Label htmlFor="basePrice" className="text-white">Base Price</Label>
              <div className="relative mt-2">
                <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input
                  id="basePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(e) => handleInputChange('basePrice', e.target.value)}
                  placeholder="49.99"
                  className="pl-10 bg-[#0a0a0a] border-gray-800 text-white"
                />
              </div>
              <p className="text-gray-400 text-sm mt-1 ml-1">Please select a base price greater than $0</p>
            </div>
          )}

          {/* Discount Options */}
          {!formData.isFree && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Enable Discount</Label>
                  <p className="text-sm text-gray-400">Offer a limited-time discount</p>
                </div>
                <Switch
                  checked={formData.hasDiscount}
                  onCheckedChange={(checked) => handleInputChange('hasDiscount', checked)}
                />
              </div>

              {formData.hasDiscount && (
                <div className="space-y-4 pl-4 border-l-2 border-gray-800">
                  <div>
                    <Label htmlFor="discountPrice" className="text-white">Discounted Price</Label>
                    <div className="relative mt-2">
                      <Gift className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      <Input
                        id="discountPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.discountPrice}
                        onChange={(e) => handleInputChange('discountPrice', e.target.value)}
                        placeholder="39.99"
                        className="pl-10 bg-[#0a0a0a] border-gray-800 text-white"
                      />
                    </div>
                    <p className="text-gray-400 text-sm mt-1 ml-1">Please select a discount price greater than $0</p>
                  </div>

                  <div>
                    <Label htmlFor="discountEnds" className="text-white">Discount Ends</Label>
                    <div className="relative mt-2">
                      <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      <Input
                        id="discountEnds"
                        type="datetime-local"
                        value={formData.discountEnds}
                        onChange={(e) => handleInputChange('discountEnds', e.target.value)}
                        className="pl-10 bg-[#0a0a0a] border-gray-800 text-white"
                      />
                      <p className="text-gray-400 text-sm mt-1 ml-1">Please select a discount end date</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Price Preview */}
        {!formData.isFree && (
          <div className="mt-8 p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Price Preview</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Base Price</span>
                <span className="text-white">${formData.basePrice || '0.00'}</span>
              </div>
              {formData.hasDiscount && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Discounted Price</span>
                    <span className="text-green-400">${formData.discountPrice || '0.00'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Savings</span>
                    <span className="text-green-400">
                      ${((parseFloat(formData.basePrice) || 0) - (parseFloat(formData.discountPrice) || 0)).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-gray-800 text-gray-400"
          >
            Back
          </Button>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => onSave(formData)}
              disabled={isLoading}
              className="border-gray-800 text-gray-400"
            >
              Save Draft
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !isFormValid}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}