import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Banknote, BadgeCheck, BadgeAlert, Loader2, ExternalLink } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const DoctorFinancialsForm = ({
  ProfileSection,
  profileData,
  isStripeLoading,
  handleInputChange,
  handleStripeConnect
}) => {
  return (
    <div className="space-y-8">
      <ProfileSection icon={DollarSign} title="Payment Setup" description="Manage how you receive payments from patients.">
          {profileData.stripe_onboarding_complete ? (
              <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <BadgeCheck className="w-8 h-8 text-green-600 flex-shrink-0" />
                  <div>
                      <h4 className="font-semibold text-green-800">Stripe Account Connected</h4>
                      <p className="text-sm text-green-700">Your account is fully onboarded and ready to receive automatic payouts.</p>
                  </div>
              </div>
          ) : (
              <div className="flex flex-col md:flex-row items-center gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <BadgeAlert className="w-8 h-8 text-yellow-600 flex-shrink-0" />
                  <div className="flex-1">
                      <h4 className="font-semibold text-yellow-800">Automatic Payouts Not Active</h4>
                      <p className="text-sm text-yellow-700">Connect with Stripe to receive your payments automatically and securely. This is the recommended method.</p>
                  </div>
                  <Button 
                      type="button" 
                      onClick={handleStripeConnect} 
                      disabled={isStripeLoading}
                      className="w-full md:w-auto"
                  >
                      {isStripeLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                          <ExternalLink className="w-4 h-4 mr-2" />
                      )}
                      Connect Stripe Account
                  </Button>
              </div>
          )}

          <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="stripe_connect_id">Manual Stripe Account ID (Optional)</Label>
              <Input 
                  id="stripe_connect_id" 
                  value={profileData.stripe_connect_id || ''} 
                  onChange={(e) => handleInputChange('stripe_connect_id', e.target.value)} 
                  placeholder="acct_... (if you already have an ID)"
              />
              <p className="text-xs text-muted-foreground">
                  Use the button above to create an account. Only use this field if you need to manually enter or edit an existing Stripe Account ID.
              </p>
          </div>
      </ProfileSection>

      <ProfileSection icon={Banknote} title="Bank Details (Manual Payout)" description="This information will ONLY be used for manual bank transfers if you choose not to connect a Stripe account. This method is not recommended and may delay your payments.">
          <div className="space-y-2">
              <Label htmlFor="bank_payment_details">Bank Information (IBAN, SWIFT, etc.)</Label>
              <Textarea 
                  id="bank_payment_details" 
                  value={profileData.bank_payment_details || ''} 
                  onChange={(e) => handleInputChange('bank_payment_details', e.target.value)}
                  placeholder="e.g.&#10;IBAN: PT50 0000 0000 0000 0000 0000 0&#10;SWIFT/BIC: BESCPTPL&#10;Bank Name: My Bank&#10;Account Holder: Dr. Your Full Name"
                  rows={5}
              />
          </div>
      </ProfileSection>
    </div>
  );
};

export default DoctorFinancialsForm;