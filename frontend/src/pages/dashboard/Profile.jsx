import {
  Building,
  Calendar,
  CheckCircle,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  User
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
    },
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        company: user.company || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || '',
          country: user.address?.country || 'India',
        },
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setProfileForm(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setProfileForm(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const response = await authService.updateProfile(profileForm);
      updateUser(response.data.client);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      toast.success('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Password change error:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-medium text-brand-text-primary">Profile Settings</h1>
        <p className="text-brand-text-secondary mt-1">Manage your account information and preferences</p>
      </div>

      {/* Account Info Card */}
      <div className="bg-brand-dark border border-gray-300 rounded-3xl p-8 mb-8 relative overflow-hidden">
        {/* Background Decorations removed */}

        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-brand-green/10 flex items-center justify-center border border-brand-green/20">
            <span className="text-2xl font-serif font-bold text-brand-green">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-serif font-medium text-brand-text-primary mb-1">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-brand-text-secondary flex items-center gap-2 text-sm mb-3">
              <Mail size={14} />
              {user?.email}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gray/10 border border-gray-300 text-xs text-brand-text-secondary">
              <Calendar size={12} />
              <span>Member since {formatDate(user?.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-brand-dark border border-gray-300 rounded-2xl overflow-hidden mb-8">
        <div className="flex border-b border-brand-gray/20">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-6 py-4 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'profile'
              ? 'text-brand-green border-b-2 border-brand-green bg-brand-gray/10'
              : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-gray/10'
              }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 px-6 py-4 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'password'
              ? 'text-brand-green border-b-2 border-brand-green bg-brand-gray/10'
              : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-gray/10'
              }`}
          >
            Change Password
          </button>
        </div>

        <div className="p-8">
          {/* Profile Form */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-8">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-serif text-brand-text-primary mb-6 flex items-center gap-2">
                  <User size={20} className="text-brand-green" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-2">
                      First Name
                    </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-brand-green transition-colors" size={18} />
                      <input
                        type="text"
                        name="firstName"
                        value={profileForm.firstName}
                        onChange={handleProfileChange}
                        placeholder="John"
                        className="w-full pl-11 pr-4 py-3 bg-white border-2 border-brand-gray/40 rounded-xl text-brand-text-primary placeholder:text-brand-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all font-light"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-2">
                      Last Name
                    </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-brand-green transition-colors" size={18} />
                      <input
                        type="text"
                        name="lastName"
                        value={profileForm.lastName}
                        onChange={handleProfileChange}
                        placeholder="Doe"
                        className="w-full pl-11 pr-4 py-3 bg-white border-2 border-brand-gray/40 rounded-xl text-brand-text-primary placeholder:text-brand-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all font-light"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                      <input
                        type="email"
                        name="email"
                        value={profileForm.email}
                        onChange={handleProfileChange}
                        className="w-full pl-11 pr-4 py-3 bg-brand-gray/5 border border-gray-300 rounded-xl text-brand-text-secondary/50 cursor-not-allowed font-light"
                        disabled
                      />
                    </div>
                    <p className="text-[10px] text-brand-text-secondary mt-1.5 ml-1">Email cannot be changed.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-2">
                      Phone Number
                    </label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-brand-green transition-colors" size={18} />
                      <input
                        type="tel"
                        name="phone"
                        value={profileForm.phone}
                        onChange={handleProfileChange}
                        placeholder="+1 234 567 8900"
                        className="w-full pl-11 pr-4 py-3 bg-white border-2 border-brand-gray/40 rounded-xl text-brand-text-primary placeholder:text-brand-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all font-light"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-2">
                      Company (Optional)
                    </label>
                    <div className="relative group">
                      <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-brand-green transition-colors" size={18} />
                      <input
                        type="text"
                        name="company"
                        value={profileForm.company}
                        onChange={handleProfileChange}
                        placeholder="Company Name"
                        className="w-full pl-11 pr-4 py-3 bg-white border-2 border-brand-gray/40 rounded-xl text-brand-text-primary placeholder:text-brand-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all font-light"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-serif text-brand-text-primary mb-6 flex items-center gap-2 pt-6 border-t border-brand-gray/20">
                  <MapPin size={20} className="text-brand-green" />
                  Address Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-2">
                      Street Address
                    </label>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-brand-green transition-colors" size={18} />
                      <input
                        type="text"
                        name="address.street"
                        value={profileForm.address.street}
                        onChange={handleProfileChange}
                        placeholder="123 Main St"
                        className="w-full pl-11 pr-4 py-3 bg-white border-2 border-brand-gray/40 rounded-xl text-brand-text-primary placeholder:text-brand-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all font-light"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="address.city"
                      value={profileForm.address.city}
                      onChange={handleProfileChange}
                      placeholder="New York"
                      className="w-full px-4 py-3 bg-white border-2 border-brand-gray/40 rounded-xl text-brand-text-primary placeholder:text-brand-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all font-light"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-2">
                      State / Province
                    </label>
                    <input
                      type="text"
                      name="address.state"
                      value={profileForm.address.state}
                      onChange={handleProfileChange}
                      placeholder="NY"
                      className="w-full px-4 py-3 bg-white border-2 border-brand-gray/40 rounded-xl text-brand-text-primary placeholder:text-brand-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all font-light"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-2">
                      ZIP / Postal Code
                    </label>
                    <input
                      type="text"
                      name="address.zipCode"
                      value={profileForm.address.zipCode}
                      onChange={handleProfileChange}
                      placeholder="10001"
                      className="w-full px-4 py-3 bg-white border-2 border-brand-gray/40 rounded-xl text-brand-text-primary placeholder:text-brand-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all font-light"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-2">
                      Country
                    </label>
                    <select
                      name="address.country"
                      value={profileForm.address.country}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 bg-white border-2 border-brand-gray/40 rounded-xl text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all cursor-pointer font-light"
                    >
                      <option value="India">India</option>
                      <option value="USA">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-brand-gray/20">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-brand-green text-white font-bold rounded-full hover:bg-brand-green-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Password Form */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-xl">
              <div>
                <h3 className="text-lg font-serif text-brand-text-primary mb-6 flex items-center gap-2">
                  <Key size={20} className="text-brand-green" />
                  Change Password
                </h3>
                <p className="text-sm text-brand-text-secondary mb-8">
                  Ensure your account is using a long, random password to stay secure.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-2">
                  Current Password
                </label>
                <div className="relative group">
                  <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-brand-green transition-colors" size={18} />
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    className="w-full pl-11 pr-12 py-3 bg-white border-2 border-brand-gray/40 rounded-xl text-brand-text-primary placeholder:text-brand-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all font-light"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-brand-text-secondary hover:text-brand-text-primary transition-colors"
                  >
                    {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-2">
                  New Password
                </label>
                <div className="relative group">
                  <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-brand-green transition-colors" size={18} />
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    className="w-full pl-11 pr-12 py-3 bg-white border-2 border-brand-gray/40 rounded-xl text-brand-text-primary placeholder:text-brand-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all font-light"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-brand-text-secondary hover:text-brand-text-primary transition-colors"
                  >
                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-[10px] text-brand-text-secondary mt-1.5 ml-1">Must be at least 8 characters long.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-2">
                  Confirm New Password
                </label>
                <div className="relative group">
                  <CheckCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-brand-green transition-colors" size={18} />
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    className="w-full pl-11 pr-12 py-3 bg-white border-2 border-brand-gray/40 rounded-xl text-brand-text-primary placeholder:text-brand-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all font-light"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-brand-text-secondary hover:text-brand-text-primary transition-colors"
                  >
                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-brand-gray/20">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto px-8 py-3 bg-brand-green text-white font-bold rounded-full hover:bg-brand-green-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <Key size={18} />
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
