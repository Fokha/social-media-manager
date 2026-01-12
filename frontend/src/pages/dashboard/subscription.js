import { useQuery, useMutation } from '@tanstack/react-query';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { subscriptionsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  CheckIcon,
  SparklesIcon,
  CreditCardIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const planFeatures = {
  free: ['2 social accounts', '20 posts/month', '50 AI credits', 'Basic analytics'],
  basic: ['5 social accounts', '100 posts/month', '500 AI credits', 'Post scheduling', 'Email support'],
  pro: ['15 social accounts', '500 posts/month', '2000 AI credits', 'Advanced analytics', 'Team (5 users)', 'Priority support'],
  business: ['50 social accounts', 'Unlimited posts', '10000 AI credits', 'Custom workflows', 'API access', 'Team (20 users)', 'Dedicated manager']
};

export default function Subscription() {
  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => subscriptionsAPI.plans().then(res => res.data.data.plans)
  });

  const { data: current } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionsAPI.current().then(res => res.data.data.subscription)
  });

  const { data: usage } = useQuery({
    queryKey: ['usage'],
    queryFn: () => subscriptionsAPI.usage().then(res => res.data.data)
  });

  const { data: invoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => subscriptionsAPI.invoices().then(res => res.data.data.invoices)
  });

  const checkoutMutation = useMutation({
    mutationFn: (plan) => subscriptionsAPI.createCheckout(plan),
    onSuccess: (response) => {
      window.location.href = response.data.data.url;
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to start checkout');
    }
  });

  const portalMutation = useMutation({
    mutationFn: () => subscriptionsAPI.createPortal(),
    onSuccess: (response) => {
      window.location.href = response.data.data.url;
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to open billing portal');
    }
  });

  const cancelMutation = useMutation({
    mutationFn: () => subscriptionsAPI.cancel(),
    onSuccess: () => {
      toast.success('Subscription will be canceled at period end');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to cancel');
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-600">Manage your plan and billing</p>
      </div>

      {/* Current Plan */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
            <p className="text-3xl font-bold text-primary-600 capitalize mt-1">
              {current?.plan || 'Free'}
            </p>
            {current?.currentPeriodEnd && (
              <p className="text-sm text-gray-500 mt-1">
                {current.cancelAtPeriodEnd
                  ? `Cancels on ${new Date(current.currentPeriodEnd).toLocaleDateString()}`
                  : `Renews on ${new Date(current.currentPeriodEnd).toLocaleDateString()}`}
              </p>
            )}
          </div>
          {current?.stripeCustomerId && (
            <button
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isLoading}
              className="btn btn-secondary flex items-center gap-2"
            >
              <CreditCardIcon className="w-5 h-5" />
              Manage Billing
            </button>
          )}
        </div>
      </div>

      {/* Usage */}
      {usage && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Usage</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Social Accounts</p>
              <p className="text-xl font-bold">
                {usage.usage.socialAccounts}
                <span className="text-sm text-gray-400 font-normal">
                  /{usage.limits.socialAccounts === -1 ? '∞' : usage.limits.socialAccounts}
                </span>
              </p>
              <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      (usage.usage.socialAccounts / (usage.limits.socialAccounts || 1)) * 100,
                      100
                    )}%`
                  }}
                />
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Posts This Month</p>
              <p className="text-xl font-bold">
                {usage.usage.postsThisMonth}
                <span className="text-sm text-gray-400 font-normal">
                  /{usage.limits.postsPerMonth === -1 ? '∞' : usage.limits.postsPerMonth}
                </span>
              </p>
              <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{
                    width: usage.limits.postsPerMonth === -1 ? 0 : `${Math.min(
                      (usage.usage.postsThisMonth / usage.limits.postsPerMonth) * 100,
                      100
                    )}%`
                  }}
                />
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">AI Credits Used</p>
              <p className="text-xl font-bold">
                {usage.usage.aiCreditsUsed}
                <span className="text-sm text-gray-400 font-normal">
                  /{usage.limits.aiCredits === -1 ? '∞' : usage.limits.aiCredits}
                </span>
              </p>
              <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{
                    width: usage.limits.aiCredits === -1 ? 0 : `${Math.min(
                      (usage.usage.aiCreditsUsed / usage.limits.aiCredits) * 100,
                      100
                    )}%`
                  }}
                />
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Team Members</p>
              <p className="text-xl font-bold">
                {usage.usage.teamMembers}
                <span className="text-sm text-gray-400 font-normal">
                  /{usage.limits.teamMembers === -1 ? '∞' : usage.limits.teamMembers}
                </span>
              </p>
              <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{
                    width: usage.limits.teamMembers === -1 ? 0 : `${Math.min(
                      (usage.usage.teamMembers / usage.limits.teamMembers) * 100,
                      100
                    )}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans?.map((plan) => (
            <div
              key={plan.id}
              className={`card relative ${plan.popular ? 'ring-2 ring-primary-500' : ''}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-500 text-white text-xs font-medium rounded-full">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <p className="text-3xl font-bold mt-2">
                ${plan.price}
                <span className="text-sm text-gray-500 font-normal">/mo</span>
              </p>

              <ul className="mt-4 space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => plan.id !== 'free' && checkoutMutation.mutate(plan.id)}
                disabled={
                  checkoutMutation.isLoading ||
                  current?.plan === plan.id ||
                  plan.id === 'free'
                }
                className={`w-full mt-4 btn ${
                  current?.plan === plan.id
                    ? 'bg-gray-100 text-gray-500 cursor-default'
                    : plan.popular
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
              >
                {current?.plan === plan.id ? 'Current Plan' : plan.id === 'free' ? 'Free' : 'Upgrade'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Invoices */}
      {invoices?.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-sm font-medium text-gray-500">Date</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-500">Amount</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-500">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-100">
                    <td className="py-3 text-sm text-gray-900">
                      {new Date(invoice.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-sm text-gray-900">
                      ${invoice.amount.toFixed(2)} {invoice.currency.toUpperCase()}
                    </td>
                    <td className="py-3">
                      <span className={`status-badge ${
                        invoice.status === 'paid' ? 'status-published' : 'status-failed'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {invoice.pdfUrl && (
                        <a
                          href={invoice.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-600 hover:underline"
                        >
                          Download
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

Subscription.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
