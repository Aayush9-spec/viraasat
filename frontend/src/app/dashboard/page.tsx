'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { format } from 'date-fns';

import {
  Package,
  Heart,
  MapPin,
  Star,
  Bell,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  ShoppingBag,
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  MessageSquare,
  Eye,
  RotateCcw,
  Compass,
  Check,
  Share2,
  Lock,
  Loader2,
} from 'lucide-react';
import { validateName, validatePhoneNumber } from '@/lib/validation/name-validation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ViraasatLogo } from '@/components/shared/visuals/viraasat-logo';

import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { useWishlist } from '@/context/wishlist-context';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/core/hooks/use-toast';
import { useTranslation } from '@/core/hooks/use-translation';
import { cn, getProductImage } from '@/core/utils/utils';
import { orders as staticOrders, products as catalogProducts } from '@/lib/data';
import { AnimatedCounter, SlideUp, FadeIn, StaggerContainer, StaggerItem } from '@/components/animations';
import { OrderService } from '@/features/orders/order-service';
import { ReviewService } from '@/features/reviews/review-service';
import { NotificationService } from '@/features/notifications/notification-service';
import type { Order } from '@/types/order';
import type { ProductReview } from '@/types/review';
import type { InAppNotification } from '@/types/notification';

// 28 Indian States & UTs for shipping address picker
const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

const CRAFT_PREFERENCES = [
  { id: 'blue-pottery', name: 'Jaipur Blue Pottery', region: 'Rajasthan', icon: '🏺' },
  { id: 'banarasi-silk', name: 'Banarasi Brocade & Silk', region: 'Varanasi, Uttar Pradesh', icon: '🧵' },
  { id: 'bastar-dhokra', name: 'Bastar Lost-Wax Dhokra', region: 'Chhattisgarh', icon: '🐂' },
  { id: 'madhubani-art', name: 'Mithila Madhubani Art', region: 'Bihar', icon: '🎨' },
  { id: 'pashmina-shawl', name: 'Kashmiri Sozni Pashmina', region: 'Jammu and Kashmir', icon: '🧣' },
  { id: 'channapatna-toys', name: 'Channapatna Lacquerware Toys', region: 'Karnataka', icon: '🪵' },
  { id: 'kutch-rogan', name: 'Kutch Rogan & Ajrakh Printing', region: 'Gujarat', icon: '✨' },
  { id: 'tanjore-gold', name: 'Tanjore 24k Gold Foil Painting', region: 'Tamil Nadu', icon: '🖼️' },
  { id: 'terracotta-craft', name: 'Bankura Terracotta Craft', region: 'West Bengal', icon: '🪔' },
];

export interface SavedAddress {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
  label?: 'Home' | 'Studio' | 'Gallery' | 'Office';
}

type TabType =
  | 'overview'
  | 'orders'
  | 'wishlist'
  | 'addresses'
  | 'reviews'
  | 'notifications'
  | 'profile';

function CustomerDashboardContent() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { wishlist, removeFromWishlist } = useWishlist();
  const { addItem } = useCart();

  // Active Tab
  const initialTab = (searchParams.get('tab') as TabType) || 'overview';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const changeTab = (tab: TabType) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType;
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams, activeTab]);

  // ================= 1. ORDERS STATE & FETCH =================
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersSearch, setOrdersSearch] = useState('');
  const [ordersFilter, setOrdersFilter] = useState<'all' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    async function loadOrders() {
      setOrdersLoading(true);
      try {
        // 1. Fetch DB orders
        const dbOrders = await OrderService.getOrdersByBuyer(
          user?.id || '',
          user?.primaryEmailAddress?.emailAddress
        );

        // 2. Fetch session order if any
        let sessionOrder: Order | null = null;
        if (typeof window !== 'undefined') {
          const raw = sessionStorage.getItem('viraasat-last-order');
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (parsed?.orderId) {
                sessionOrder = {
                  id: parsed.orderId,
                  buyerId: user?.id || 'current-user',
                  artisanId: 'artisan-1',
                  items: (parsed.items || []).map((it: any) => ({
                    productId: it.productId,
                    productName: it.productName,
                    quantity: it.quantity || 1,
                    unitPrice: it.unitPrice || 0,
                    itemImageUrl: '',
                  })),
                  totalAmount: parsed.total || 0,
                  shippingAddress: {
                    fullName: parsed.customerName || user?.fullName || 'Collector',
                    addressLine1: 'Primary Shipping Destination',
                    city: 'Jaipur',
                    state: 'Rajasthan',
                    zipCode: '302001',
                    country: 'India',
                  },
                  status: 'Processing',
                  paymentStatus: 'Paid',
                  orderDate: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
              }
            } catch {}
          }
        }

        // 3. User static fallback orders
        const userStatics = staticOrders.filter(
          (o) => o.buyerId === user?.id || o.userId === user?.id || o.buyerId === 'user-123'
        );

        // Merge & attach thumbnails
        const productMap = new Map(catalogProducts.map((p) => [p.id, p]));
        const combined = [
          ...(sessionOrder ? [sessionOrder] : []),
          ...dbOrders,
          ...userStatics,
        ];

        // Deduplicate by id
        const seen = new Set<string>();
        const hydrated: Order[] = [];
        for (const ord of combined) {
          if (!seen.has(ord.id)) {
            seen.add(ord.id);
            hydrated.push({
              ...ord,
              items: (ord.items || []).map((item) => {
                const prod = productMap.get(item.productId);
                return {
                  ...item,
                  itemImageUrl: item.itemImageUrl || prod?.images?.[0] || '/images/products/clean/handcrafted-terracotta-diya.jpg',
                };
              }),
            });
          }
        }

        if (isMounted) {
          setOrdersList(hydrated);
        }
      } catch (e) {
        console.warn('Orders load error:', e);
      } finally {
        if (isMounted) setOrdersLoading(false);
      }
    }

    loadOrders();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const filteredOrders = useMemo(() => {
    return ordersList.filter((ord) => {
      const matchFilter =
        ordersFilter === 'all'
          ? true
          : ord.status?.toLowerCase() === ordersFilter.toLowerCase();
      const matchSearch =
        !ordersSearch.trim() ||
        ord.id.toLowerCase().includes(ordersSearch.toLowerCase()) ||
        ord.items.some((i) => i.productName.toLowerCase().includes(ordersSearch.toLowerCase()));
      return matchFilter && matchSearch;
    });
  }, [ordersList, ordersFilter, ordersSearch]);

  // ================= 2. ADDRESSES STATE & MANAGEMENT =================
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Rajasthan',
    zipCode: '',
    isDefault: false,
    label: 'Home' as 'Home' | 'Studio' | 'Gallery' | 'Office',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('customer_saved_addresses');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSavedAddresses(parsed);
            return;
          }
        }

        // Fallback: check customer_shipping_address
        const single = localStorage.getItem('customer_shipping_address');
        if (single) {
          const parsed = JSON.parse(single);
          const initialAddr: SavedAddress = {
            id: 'addr-default-1',
            fullName: `${parsed.firstName || user?.firstName || 'Patron'} ${parsed.lastName || user?.lastName || ''}`.trim(),
            phone: parsed.phone || '+91 98765 43210',
            addressLine1: parsed.address1 || 'Heritage Lane, Civil Lines',
            addressLine2: parsed.address2 || '',
            city: parsed.city || 'Jaipur',
            state: parsed.stateName || 'Rajasthan',
            zipCode: parsed.zip || '302006',
            isDefault: true,
            label: 'Home',
          };
          setSavedAddresses([initialAddr]);
          localStorage.setItem('customer_saved_addresses', JSON.stringify([initialAddr]));
          return;
        }

        // Default initial seed
        const defaultSeed: SavedAddress = {
          id: 'addr-seed-1',
          fullName: user?.fullName || 'Artisan Collector',
          phone: '+91 98290 12345',
          addressLine1: 'B-14, Heritage Haveli, C-Scheme',
          city: 'Jaipur',
          state: 'Rajasthan',
          zipCode: '302001',
          isDefault: true,
          label: 'Home',
        };
        setSavedAddresses([defaultSeed]);
        localStorage.setItem('customer_saved_addresses', JSON.stringify([defaultSeed]));
      } catch (e) {
        console.warn('Address load error:', e);
      }
    }
  }, [user]);

  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      fullName: user?.fullName || '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: 'Rajasthan',
      zipCode: '',
      isDefault: savedAddresses.length === 0,
      label: 'Home',
    });
    setAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr: SavedAddress) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
      isDefault: addr.isDefault,
      label: addr.label || 'Home',
    });
    setAddressModalOpen(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.fullName.trim() || !addressForm.addressLine1.trim() || !addressForm.city.trim() || !addressForm.zipCode.trim()) {
      toast({ title: 'Incomplete Address', description: 'Please fill in full name, address line 1, city, and PIN code.', variant: 'destructive' });
      return;
    }

    let updated: SavedAddress[];
    if (editingAddressId) {
      updated = savedAddresses.map((a) => {
        if (a.id === editingAddressId) {
          return {
            ...a,
            ...addressForm,
            id: a.id,
          };
        }
        return addressForm.isDefault ? { ...a, isDefault: false } : a;
      });
    } else {
      const newAddress: SavedAddress = {
        id: `addr-${Date.now()}`,
        ...addressForm,
      };
      if (addressForm.isDefault) {
        updated = [newAddress, ...savedAddresses.map((a) => ({ ...a, isDefault: false }))];
      } else {
        updated = [...savedAddresses, newAddress];
      }
    }

    setSavedAddresses(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('customer_saved_addresses', JSON.stringify(updated));
      const def = updated.find((a) => a.isDefault) || updated[0];
      if (def) {
        localStorage.setItem(
          'customer_shipping_address',
          JSON.stringify({
            firstName: def.fullName.split(' ')[0] || '',
            lastName: def.fullName.split(' ').slice(1).join(' ') || '',
            address1: def.addressLine1,
            address2: def.addressLine2 || '',
            city: def.city,
            stateName: def.state,
            zip: def.zipCode,
            phone: def.phone,
          })
        );
      }
    }

    setAddressModalOpen(false);
    toast({ title: 'Address Saved', description: 'Your shipping address has been updated successfully.' });
  };

  const handleDeleteAddress = (id: string) => {
    const updated = savedAddresses.filter((a) => a.id !== id);
    if (updated.length > 0 && !updated.some((a) => a.isDefault)) {
      updated[0].isDefault = true;
    }
    setSavedAddresses(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('customer_saved_addresses', JSON.stringify(updated));
    }
    toast({ title: 'Address Removed', description: 'Shipping destination removed from your account.' });
  };

  const handleSetDefaultAddress = (id: string) => {
    const updated = savedAddresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    setSavedAddresses(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('customer_saved_addresses', JSON.stringify(updated));
      const def = updated.find((a) => a.id === id);
      if (def) {
        localStorage.setItem(
          'customer_shipping_address',
          JSON.stringify({
            firstName: def.fullName.split(' ')[0] || '',
            lastName: def.fullName.split(' ').slice(1).join(' ') || '',
            address1: def.addressLine1,
            address2: def.addressLine2 || '',
            city: def.city,
            stateName: def.state,
            zip: def.zipCode,
            phone: def.phone,
          })
        );
      }
    }
    toast({ title: 'Default Address Set', description: 'Selected address will be used for 1-click checkout.' });
  };

  // ================= 3. REVIEWS STATE & EDIT =================
  const [reviewsList, setReviewsList] = useState<ProductReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [editReviewModalOpen, setEditReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ProductReview | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reviewToDeleteId, setReviewToDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    async function loadReviews() {
      setReviewsLoading(true);
      try {
        const list = await ReviewService.getCustomerReviews(user?.id || 'user-collector-1');
        if (isMounted) setReviewsList(list);
      } catch (e) {
        console.warn('Reviews load error:', e);
      } finally {
        if (isMounted) setReviewsLoading(false);
      }
    }

    loadReviews();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleOpenEditReview = (r: ProductReview) => {
    setEditingReview(r);
    setReviewForm({
      rating: r.rating,
      title: r.title || '',
      comment: r.comment,
    });
    setEditReviewModalOpen(true);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview || !user) return;
    if (reviewForm.comment.trim().length < 5) {
      toast({ title: 'Review Too Short', description: 'Please provide at least 5 characters of feedback.', variant: 'destructive' });
      return;
    }

    const res = await ReviewService.updateReview(
      {
        reviewId: editingReview.id,
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment,
      },
      { id: user.id }
    );

    if (res.success && res.review) {
      setReviewsList((prev) =>
        prev.map((r) => (r.id === editingReview.id ? { ...r, ...res.review } : r))
      );
      setEditReviewModalOpen(false);
      toast({ title: 'Review Updated', description: 'Your verified artisan feedback has been saved.' });
    } else {
      toast({ title: 'Update Failed', description: res.error || 'Could not update review.', variant: 'destructive' });
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewToDeleteId || !user) return;
    const res = await ReviewService.deleteReview(reviewToDeleteId, user);
    if (res.success) {
      setReviewsList((prev) => prev.filter((r) => r.id !== reviewToDeleteId));
      toast({ title: 'Review Deleted', description: 'Your review was removed.' });
    } else {
      toast({ title: 'Could Not Delete', description: res.error || 'Failed to delete review.', variant: 'destructive' });
    }
    setDeleteConfirmOpen(false);
    setReviewToDeleteId(null);
  };

  // ================= 4. NOTIFICATIONS STATE & ACTIONS =================
  const [notificationsList, setNotificationsList] = useState<InAppNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    async function loadNotifications() {
      setNotificationsLoading(true);
      try {
        const { notifications } = await NotificationService.getNotificationsForUser(user?.id || '', 'customer');
        if (isMounted) setNotificationsList(notifications);
      } catch (e) {
        console.warn('Notifications load error:', e);
      } finally {
        if (isMounted) setNotificationsLoading(false);
      }
    }

    loadNotifications();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    await NotificationService.markAsRead(id);
    setNotificationsList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!user) return;
    await NotificationService.markAllAsRead(user.id);
    setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true })));
    toast({ title: 'All Caught Up', description: 'All notifications marked as read.' });
  };

  // ================= 5. PROFILE FORM STATE & ACTIONS =================
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [profileState, setProfileState] = useState('Rajasthan');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Jaipur Blue Pottery',
    'Banarasi Brocade & Silk',
    'Bastar Lost-Wax Dhokra',
  ]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState<{
    firstName?: string;
    lastName?: string;
    phone?: string;
  }>({});
  const [savedProfileSnapshot, setSavedProfileSnapshot] = useState<{
    firstName: string;
    lastName: string;
    phone: string;
    state: string;
    city: string;
    interests: string[];
  }>({
    firstName: '',
    lastName: '',
    phone: '',
    state: 'Rajasthan',
    city: '',
    interests: [
      'Jaipur Blue Pottery',
      'Banarasi Brocade & Silk',
      'Bastar Lost-Wax Dhokra',
    ],
  });

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const initialFirst = user.firstName || '';
    const initialLast = user.lastName || '';
    setProfileFirstName(initialFirst);
    setProfileLastName(initialLast);

    const meta = user.unsafeMetadata as Record<string, any> | undefined;
    const initialPhone = meta?.phone ? String(meta.phone) : '';
    const initialInterests =
      Array.isArray(meta?.interests) && meta.interests.length > 0
        ? meta.interests
        : [
            'Jaipur Blue Pottery',
            'Banarasi Brocade & Silk',
            'Bastar Lost-Wax Dhokra',
          ];
    const initialState = meta?.state ? String(meta.state) : 'Rajasthan';
    const initialCity = meta?.city ? String(meta.city) : '';

    if (initialPhone) setProfilePhone(initialPhone);
    if (initialInterests.length > 0) setSelectedInterests(initialInterests);
    if (initialState) setProfileState(initialState);
    if (initialCity) setProfileCity(initialCity);

    setSavedProfileSnapshot({
      firstName: initialFirst,
      lastName: initialLast,
      phone: initialPhone,
      state: initialState,
      city: initialCity,
      interests: initialInterests,
    });

    if (typeof window !== 'undefined') {
      try {
        const rawAddr = localStorage.getItem('customer_shipping_address');
        if (rawAddr) {
          const parsed = JSON.parse(rawAddr);
          if (parsed.city) setProfileCity(parsed.city);
          if (parsed.stateName) setProfileState(parsed.stateName);
          if (parsed.phone) setProfilePhone(parsed.phone);
        }
        const rawPrefs = localStorage.getItem('customer_profile_preferences');
        if (rawPrefs) {
          const parsed = JSON.parse(rawPrefs);
          if (Array.isArray(parsed.interests) && parsed.interests.length > 0) {
            setSelectedInterests(parsed.interests);
          }
        }
      } catch {}
    }

    // Fetch persisted profile from server/database
    async function fetchDbProfile() {
      try {
        const res = await fetch('/api/users/profile');
        if (res.ok) {
          const json = await res.json();
          const p = json?.data?.profile;
          if (p && isMounted) {
            if (p.firstName) setProfileFirstName(p.firstName);
            if (p.lastName) setProfileLastName(p.lastName);
            if (p.phone) setProfilePhone(p.phone);
            if (p.state) setProfileState(p.state);
            if (p.city) setProfileCity(p.city);
            if (Array.isArray(p.interests) && p.interests.length > 0) {
              setSelectedInterests(p.interests);
            }
            setSavedProfileSnapshot({
              firstName: p.firstName || initialFirst,
              lastName: p.lastName || initialLast,
              phone: p.phone || initialPhone,
              state: p.state || initialState,
              city: p.city || initialCity,
              interests:
                Array.isArray(p.interests) && p.interests.length > 0
                  ? p.interests
                  : initialInterests,
            });
          }
        }
      } catch {
        // Fallback to memory & Clerk metadata
      }
    }

    fetchDbProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const toggleInterest = (craftName: string) => {
    setSelectedInterests((prev) =>
      prev.includes(craftName) ? prev.filter((c) => c !== craftName) : [...prev, craftName]
    );
  };

  const handleCancelEditProfile = () => {
    setProfileFirstName(savedProfileSnapshot.firstName);
    setProfileLastName(savedProfileSnapshot.lastName);
    setProfilePhone(savedProfileSnapshot.phone);
    setProfileState(savedProfileSnapshot.state);
    setProfileCity(savedProfileSnapshot.city);
    setSelectedInterests(savedProfileSnapshot.interests);
    setProfileErrors({});
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate First Name (required, alphabetic, preserving actual order)
    const firstCheck = validateName(profileFirstName, 'First Name', true);
    // Validate Last Name (optional, alphabetic, preserving actual order)
    const lastCheck = validateName(profileLastName, 'Last Name', false);
    // Validate Phone Number (supporting Indian +91 & international)
    const phoneCheck = validatePhoneNumber(profilePhone, false);

    const newErrors: { firstName?: string; lastName?: string; phone?: string } = {};
    if (!firstCheck.isValid) newErrors.firstName = firstCheck.error;
    if (!lastCheck.isValid) newErrors.lastName = lastCheck.error;
    if (!phoneCheck.isValid) newErrors.phone = phoneCheck.error;

    if (Object.keys(newErrors).length > 0) {
      setProfileErrors(newErrors);
      toast({
        title: 'Validation Error',
        description: Object.values(newErrors)[0] || 'Please correct the highlighted fields.',
        variant: 'destructive',
      });
      return;
    }

    setProfileErrors({});
    setIsSavingProfile(true);

    try {
      // 1. Submit to server API for database persistence in Supabase
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstCheck.value,
          lastName: lastCheck.value,
          phone: phoneCheck.value,
          state: profileState,
          city: profileCity.trim(),
          interests: selectedInterests,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Server rejected profile update.');
      }

      // 2. Synchronize with Clerk client-side session & metadata
      if (typeof user.update === 'function') {
        await user.update({
          firstName: firstCheck.value,
          lastName: lastCheck.value,
          unsafeMetadata: {
            ...user.unsafeMetadata,
            phone: phoneCheck.value,
            interests: selectedInterests,
            city: profileCity.trim(),
            state: profileState,
          },
        });
      }

      // 3. Update local caches
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'customer_profile_preferences',
          JSON.stringify({ interests: selectedInterests })
        );
        localStorage.setItem(
          'customer_shipping_address',
          JSON.stringify({
            city: profileCity.trim(),
            stateName: profileState,
            phone: phoneCheck.value,
          })
        );
      }

      // 4. Update snapshot and exit edit mode
      setProfileFirstName(firstCheck.value);
      setProfileLastName(lastCheck.value);
      setProfilePhone(phoneCheck.value);
      setSavedProfileSnapshot({
        firstName: firstCheck.value,
        lastName: lastCheck.value,
        phone: phoneCheck.value,
        state: profileState,
        city: profileCity.trim(),
        interests: selectedInterests,
      });
      setIsEditingProfile(false);

      toast({
        title: 'Profile Updated ✨',
        description: 'Your profile has been updated successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Save Failed',
        description: err?.message || 'Could not update profile credentials.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Stats calculation
  const totalOrdersCount = ordersList.length;
  const pendingDeliveriesCount = ordersList.filter(
    (o) => o.status === 'Processing' || o.status === 'Shipped' || o.status === 'Pending'
  ).length;
  const wishlistCount = wishlist.length;
  const reviewsCount = reviewsList.length;
  const unreadNotificationsCount = notificationsList.filter((n) => !n.read).length;

  const formatDateSafe = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Recently';
      return format(d, 'dd MMM yyyy');
    } catch {
      return 'Recently';
    }
  };

  const getStatusBadgeConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return {
          label: 'Delivered',
          badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
          icon: CheckCircle2,
        };
      case 'shipped':
        return {
          label: 'In Transit',
          badgeClass: 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
          icon: Truck,
        };
      case 'processing':
      case 'pending':
        return {
          label: 'Crafting in Guild',
          badgeClass: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
          icon: Clock,
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          badgeClass: 'bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-900 dark:text-stone-400 dark:border-stone-700',
          icon: XCircle,
        };
      default:
        return {
          label: status || 'Processing',
          badgeClass: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
          icon: Clock,
        };
    }
  };

  return (
    <ProtectedRoute allowedRoles={['buyer']}>
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* ================= TOP BREADCRUMB & CONNOISSEUR TITLE ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8DCCB] dark:border-stone-800 pb-5">
          <div className="flex items-center gap-3.5">
            <ViraasatLogo variant="icon" size="md" className="hidden sm:inline-flex shrink-0" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#8F6826] dark:text-[#C59B4B]">
                <Link href="/" className="hover:text-[#701D24] transition-colors">Home</Link>
                <span>/</span>
                <span className="text-[#221C18] dark:text-[#FAF7F2]">Customer Hub</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#701D24] dark:text-[#E8CA82] tracking-tight">
                Customer Account & Collection Hub
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full border-[#C59B4B]/40 hover:border-[#701D24] text-xs font-semibold text-[#5E2C18] dark:text-[#FAF7F2] hover:bg-[#F3EDE2]/60"
            >
              <Link href="/shop" className="flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-[#C59B4B]" />
                <span>Explore Artisan Shop</span>
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-full bg-[#701D24] hover:bg-[#8C2B2B] text-white text-xs font-semibold shadow-xs btn-gold-shimmer"
            >
              <Link href="/auctions" className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#E8CA82]" />
                <span>Live Craft Auctions</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* ================= MAIN DASHBOARD GRID (SIDEBAR + CONTENT) ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8 items-start">
          {/* ================= LEFT SIDEBAR NAVIGATION ================= */}
          <aside className="w-full bg-white dark:bg-[#221C18] rounded-3xl border border-[#E8DCCB] dark:border-stone-800 shadow-sm p-4 sm:p-5 sticky top-24 z-20">
            {/* Viraasat Brand Medallion */}
            <div className="mb-4 pb-4 border-b border-[#E8DCCB]/60 dark:border-stone-800 flex items-center justify-between">
              <ViraasatLogo variant="full" size="md" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C59B4B] font-bold">
                Patron Hub
              </span>
            </div>

            {/* Customer Avatar & Lineage Card */}
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#FAF7F2] dark:bg-[#2A231F] border border-[#E8DCCB]/60 dark:border-stone-800 mb-5">
              <Avatar className="h-12 w-12 border-2 border-[#C59B4B] shadow-sm">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName || 'Collector'} />
                <AvatarFallback className="bg-[#701D24] text-[#FAF7F2] font-serif font-bold text-base">
                  {user?.firstName?.[0] || 'V'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="font-serif font-bold text-base text-[#221C18] dark:text-[#FAF7F2] truncate">
                  {user?.fullName || user?.firstName || 'Art Connoisseur'}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                  {user?.primaryEmailAddress?.emailAddress || 'patron@virrasat.in'}
                </p>
                <div className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold uppercase tracking-wider text-[#C59B4B]">
                  <ShieldCheck className="w-3 h-3" /> Verified Patron
                </div>
              </div>
            </div>

            {/* Desktop & Mobile Tab Switcher */}
            <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none" aria-label="Dashboard navigation">
              <button
                type="button"
                onClick={() => changeTab('overview')}
                className={cn(
                  'flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap text-left cursor-pointer',
                  activeTab === 'overview'
                    ? 'bg-[#701D24] text-white shadow-sm'
                    : 'text-[#5E2C18] dark:text-stone-300 hover:bg-[#F3EDE2]/70 dark:hover:bg-stone-800/60'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>Overview</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 hidden lg:block opacity-60" />
              </button>

              <button
                type="button"
                onClick={() => changeTab('orders')}
                className={cn(
                  'flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap text-left cursor-pointer',
                  activeTab === 'orders'
                    ? 'bg-[#701D24] text-white shadow-sm'
                    : 'text-[#5E2C18] dark:text-stone-300 hover:bg-[#F3EDE2]/70 dark:hover:bg-stone-800/60'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 shrink-0" />
                  <span>My Orders</span>
                </div>
                {totalOrdersCount > 0 && (
                  <span
                    className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full',
                      activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-[#F3EDE2] text-[#701D24] dark:bg-stone-800 dark:text-stone-200'
                    )}
                  >
                    {totalOrdersCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => changeTab('wishlist')}
                className={cn(
                  'flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap text-left cursor-pointer',
                  activeTab === 'wishlist'
                    ? 'bg-[#701D24] text-white shadow-sm'
                    : 'text-[#5E2C18] dark:text-stone-300 hover:bg-[#F3EDE2]/70 dark:hover:bg-stone-800/60'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Heart className="w-4 h-4 shrink-0" />
                  <span>Saved Wishlist</span>
                </div>
                {wishlistCount > 0 && (
                  <span
                    className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full',
                      activeTab === 'wishlist' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                    )}
                  >
                    {wishlistCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => changeTab('addresses')}
                className={cn(
                  'flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap text-left cursor-pointer',
                  activeTab === 'addresses'
                    ? 'bg-[#701D24] text-white shadow-sm'
                    : 'text-[#5E2C18] dark:text-stone-300 hover:bg-[#F3EDE2]/70 dark:hover:bg-stone-800/60'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>Shipping Addresses</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 hidden lg:block opacity-60" />
              </button>

              <button
                type="button"
                onClick={() => changeTab('reviews')}
                className={cn(
                  'flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap text-left cursor-pointer',
                  activeTab === 'reviews'
                    ? 'bg-[#701D24] text-white shadow-sm'
                    : 'text-[#5E2C18] dark:text-stone-300 hover:bg-[#F3EDE2]/70 dark:hover:bg-stone-800/60'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Star className="w-4 h-4 shrink-0" />
                  <span>Artisan Reviews</span>
                </div>
                {reviewsCount > 0 && (
                  <span
                    className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full',
                      activeTab === 'reviews' ? 'bg-white/20 text-white' : 'bg-[#F3EDE2] text-[#701D24] dark:bg-stone-800 dark:text-stone-200'
                    )}
                  >
                    {reviewsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => changeTab('notifications')}
                className={cn(
                  'flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap text-left cursor-pointer',
                  activeTab === 'notifications'
                    ? 'bg-[#701D24] text-white shadow-sm'
                    : 'text-[#5E2C18] dark:text-stone-300 hover:bg-[#F3EDE2]/70 dark:hover:bg-stone-800/60'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 shrink-0" />
                  <span>Notifications</span>
                </div>
                {unreadNotificationsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#C59B4B] animate-pulse" />
                )}
              </button>

              <button
                type="button"
                onClick={() => changeTab('profile')}
                className={cn(
                  'flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap text-left cursor-pointer',
                  activeTab === 'profile'
                    ? 'bg-[#701D24] text-white shadow-sm'
                    : 'text-[#5E2C18] dark:text-stone-300 hover:bg-[#F3EDE2]/70 dark:hover:bg-stone-800/60'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <UserIcon className="w-4 h-4 shrink-0" />
                  <span>Profile Settings</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 hidden lg:block opacity-60" />
              </button>
            </nav>

            <Separator className="my-4 bg-[#E8DCCB] dark:bg-stone-800" />

            {/* Fair-Wage Direct Guarantee Badge */}
            <div className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#2A231F] border border-[#C59B4B]/30 text-xs text-[#5E2C18] dark:text-stone-300 space-y-1 mb-4 hidden lg:block">
              <div className="flex items-center gap-1.5 font-bold text-[#701D24] dark:text-[#E8CA82] text-[11px] uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C59B4B]" />
                <span>100% Fair-Wage Direct</span>
              </div>
              <p className="text-[11px] leading-relaxed text-stone-600 dark:text-stone-400">
                Zero middleman commissions. 85%+ of acquisition value reaches master artisan families.
              </p>
            </div>

            {/* Logout Action */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => signOut({ redirectUrl: '/' })}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Viraasat</span>
              </button>
            </div>
          </aside>

          {/* ================= RIGHT MAIN CONTENT AREA ================= */}
          <main className="min-w-0 space-y-6 sm:space-y-8">
            {/* ================= TAB 1: OVERVIEW ================= */}
            {activeTab === 'overview' && (
              <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
                {/* Authentic Royal Indian Heritage Hero Banner */}
                <div className="rounded-3xl bg-gradient-to-br from-[#701D24] via-[#5E2C18] to-[#3B1410] p-6 sm:p-9 text-[#FAF7F2] shadow-xl border border-[#C59B4B]/30 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-[#C59B4B]/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-[#701D24]/40 rounded-full blur-2xl pointer-events-none" />

                  <div className="relative z-10 space-y-3 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-[#C59B4B]/40 text-xs font-semibold text-[#E8CA82]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Authentic Indian Heritage Connoisseur</span>
                    </div>

                    <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[#FAF7F2] tracking-tight leading-tight">
                      Namaste, {user?.firstName || user?.fullName || 'Collector'}!
                    </h2>

                    <p className="text-sm sm:text-base text-stone-200/90 font-light leading-relaxed">
                      Your acquisitions directly sustain verified GI craft guilds across Rajasthan, Kashmir, Bihar, Bastar, and Varanasi. Every artifact preserves centuries of ancestral devotion.
                    </p>

                    <div className="pt-3 flex flex-wrap items-center gap-3">
                      <Button
                        asChild
                        className="bg-[#C59B4B] hover:bg-[#D4AF37] text-[#221C18] font-bold rounded-full text-xs sm:text-sm px-6 shadow-md transition-all hover:scale-[1.02]"
                      >
                        <Link href="/shop" className="flex items-center gap-1.5">
                          <ShoppingBag className="w-4 h-4" />
                          <span>Discover GI Crafts</span>
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        onClick={() => changeTab('orders')}
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/15 rounded-full text-xs sm:text-sm px-5"
                      >
                        <Package className="w-4 h-4 mr-1.5 text-[#E8CA82]" />
                        <span>Track Acquisitions</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 4 Stats Cards */}
                <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <StaggerItem>
                    <Card
                      onClick={() => changeTab('orders')}
                      className="cursor-pointer bg-white dark:bg-[#221C18] border border-[#E8DCCB] dark:border-stone-800 rounded-2xl p-5 hover:border-[#C59B4B] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400">Total Orders</span>
                        <div className="w-8 h-8 rounded-full bg-[#FAF7F2] dark:bg-[#2A231F] border border-[#E8DCCB] flex items-center justify-center text-[#701D24] dark:text-[#E8CA82] group-hover:scale-110 transition-transform">
                          <Package className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="font-serif text-3xl font-bold text-[#701D24] dark:text-[#E8CA82]">
                        <AnimatedCounter value={totalOrdersCount} />
                      </div>
                      <p className="text-[11px] text-stone-500 mt-1">Acquisitions from master guilds</p>
                    </Card>
                  </StaggerItem>

                  <StaggerItem>
                    <Card
                      onClick={() => changeTab('orders')}
                      className="cursor-pointer bg-white dark:bg-[#221C18] border border-[#E8DCCB] dark:border-stone-800 rounded-2xl p-5 hover:border-[#C59B4B] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400">Deliveries</span>
                        <div className="w-8 h-8 rounded-full bg-[#FAF7F2] dark:bg-[#2A231F] border border-[#E8DCCB] flex items-center justify-center text-sky-700 dark:text-sky-300 group-hover:scale-110 transition-transform">
                          <Truck className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="font-serif text-3xl font-bold text-sky-800 dark:text-sky-400">
                        <AnimatedCounter value={pendingDeliveriesCount} />
                      </div>
                      <p className="text-[11px] text-stone-500 mt-1">Currently en route to you</p>
                    </Card>
                  </StaggerItem>

                  <StaggerItem>
                    <Card
                      onClick={() => changeTab('wishlist')}
                      className="cursor-pointer bg-white dark:bg-[#221C18] border border-[#E8DCCB] dark:border-stone-800 rounded-2xl p-5 hover:border-[#C59B4B] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400">Saved Items</span>
                        <div className="w-8 h-8 rounded-full bg-[#FAF7F2] dark:bg-[#2A231F] border border-[#E8DCCB] flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                          <Heart className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="font-serif text-3xl font-bold text-rose-700 dark:text-rose-400">
                        <AnimatedCounter value={wishlistCount} />
                      </div>
                      <p className="text-[11px] text-stone-500 mt-1">Treasures in your wishlist</p>
                    </Card>
                  </StaggerItem>

                  <StaggerItem>
                    <Card
                      onClick={() => changeTab('reviews')}
                      className="cursor-pointer bg-white dark:bg-[#221C18] border border-[#E8DCCB] dark:border-stone-800 rounded-2xl p-5 hover:border-[#C59B4B] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400">Reviews</span>
                        <div className="w-8 h-8 rounded-full bg-[#FAF7F2] dark:bg-[#2A231F] border border-[#E8DCCB] flex items-center justify-center text-amber-600 dark:text-amber-300 group-hover:scale-110 transition-transform">
                          <Star className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="font-serif text-3xl font-bold text-[#8F6826] dark:text-[#E8CA82]">
                        <AnimatedCounter value={reviewsCount} />
                      </div>
                      <p className="text-[11px] text-stone-500 mt-1">Artisan feedback provided</p>
                    </Card>
                  </StaggerItem>
                </StaggerContainer>

                {/* Recent Acquisitions Preview */}
                <Card className="bg-white dark:bg-[#221C18] border border-[#E8DCCB] dark:border-stone-800 rounded-3xl shadow-sm overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-[#E8DCCB] dark:border-stone-800 px-6 py-4">
                    <div>
                      <CardTitle className="font-serif text-xl text-[#701D24] dark:text-[#E8CA82]">Recent Acquisitions</CardTitle>
                      <CardDescription className="text-xs">Your most recent authentic handcrafted orders</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => changeTab('orders')}
                      className="text-xs font-semibold text-[#701D24] dark:text-[#E8CA82] hover:bg-[#F3EDE2]/60"
                    >
                      View All Orders ({totalOrdersCount}) <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-6">
                    {ordersList.length === 0 ? (
                      <div className="text-center py-10 space-y-3">
                        <Package className="w-10 h-10 mx-auto text-[#C59B4B] opacity-60" />
                        <h4 className="font-serif text-lg font-bold text-[#5E2C18] dark:text-stone-200">No Orders Yet</h4>
                        <p className="text-xs text-stone-500 max-w-md mx-auto">
                          Begin your heritage collection. Browse GI-tagged handicrafts crafted directly by master artisans across India.
                        </p>
                        <Button asChild size="sm" className="rounded-full bg-[#701D24] hover:bg-[#8C2B2B] text-white text-xs mt-2">
                          <Link href="/shop">Browse Catalog</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {ordersList.slice(0, 3).map((ord) => {
                          const badge = getStatusBadgeConfig(ord.status);
                          const StatusIcon = badge.icon;
                          const firstItem = ord.items[0];

                          return (
                            <div
                              key={ord.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#FAF7F2]/60 dark:bg-[#2A231F]/40 border border-[#E8DCCB] dark:border-stone-800 hover:border-[#C59B4B]/60 transition-colors"
                            >
                              <div className="flex items-center gap-3.5">
                                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white border border-[#E8DCCB] shrink-0">
                                  <Image
                                    src={firstItem?.itemImageUrl || '/images/products/clean/handcrafted-terracotta-diya.jpg'}
                                    alt={firstItem?.productName || 'Craft Item'}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-mono font-bold text-[#701D24] dark:text-[#E8CA82]">
                                    {ord.id.toUpperCase()}
                                  </div>
                                  <h4 className="font-serif font-bold text-sm text-[#221C18] dark:text-[#FAF7F2] truncate max-w-sm">
                                    {firstItem?.productName || 'Handcrafted Artifact'}
                                    {ord.items.length > 1 ? ` (+${ord.items.length - 1} more)` : ''}
                                  </h4>
                                  <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                                    <span>{formatDateSafe(ord.orderDate)}</span>
                                    <span>•</span>
                                    <span>{ord.items.length} {ord.items.length === 1 ? 'item' : 'items'}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                                <div className="text-right">
                                  <div className="font-serif font-bold text-base text-[#701D24] dark:text-[#E8CA82]">
                                    ₹{ord.totalAmount.toLocaleString('en-IN')}
                                  </div>
                                  <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border', badge.badgeClass)}>
                                    <StatusIcon className="w-3 h-3" />
                                    <span>{badge.label}</span>
                                  </span>
                                </div>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedOrder(ord);
                                    setOrderDetailsOpen(true);
                                  }}
                                  className="rounded-full text-xs border-[#E8DCCB] hover:border-[#701D24]"
                                >
                                  Details
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Empowerment Impact Banner */}
                <div className="p-6 rounded-3xl bg-[#F3EDE2]/80 dark:bg-[#251F1B] border border-[#C59B4B]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#701D24] dark:text-[#E8CA82]">
                      <ShieldCheck className="w-4 h-4 text-[#C59B4B]" />
                      <span>Empowerment & Lineage Provenance Guarantee</span>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-[#221C18] dark:text-[#FAF7F2]">
                      Zero Middlemen Markup. 100% Direct Fair-Trade.
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                      Your acquisitions are cryptographically recorded with tamper-evident provenance. We verify every artisan identity via Aadhaar & Ministry of Textiles Guild Hallmarks.
                    </p>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-full border-[#C59B4B] text-[#701D24] dark:text-[#E8CA82] hover:bg-[#701D24] hover:text-white shrink-0 text-xs font-bold"
                  >
                    <Link href="/about">Read Our Charter</Link>
                  </Button>
                </div>
              </div>
            )}

            {/* ================= TAB 2: MY ORDERS ================= */}
            {activeTab === 'orders' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#701D24] dark:text-[#E8CA82]">
                      My Acquisitions & Orders
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500">
                      Track shipment progress, verify cryptographic origin, and review your handcrafted pieces.
                    </p>
                  </div>

                  {/* Search Orders */}
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <Input
                      type="text"
                      placeholder="Search by order ID or craft..."
                      value={ordersSearch}
                      onChange={(e) => setOrdersSearch(e.target.value)}
                      className="pl-9 bg-white dark:bg-[#221C18] border-[#E8DCCB] dark:border-stone-800 rounded-full text-base md:text-sm"
                    />
                  </div>
                </div>

                {/* Status Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {(['all', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const).map((filterKey) => (
                    <button
                      key={filterKey}
                      type="button"
                      onClick={() => setOrdersFilter(filterKey)}
                      className={cn(
                        'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer border',
                        ordersFilter === filterKey
                          ? 'bg-[#701D24] text-white border-[#701D24] shadow-xs'
                          : 'bg-white dark:bg-[#221C18] text-stone-600 dark:text-stone-300 border-[#E8DCCB] dark:border-stone-800 hover:border-[#C59B4B]'
                      )}
                    >
                      {filterKey === 'all' ? 'All Orders' : filterKey}
                    </button>
                  ))}
                </div>

                {/* Orders List */}
                {ordersLoading ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-8 h-8 mx-auto border-2 border-[#701D24] border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-stone-500">Loading your verified order records...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <Card className="text-center py-16 bg-white dark:bg-[#221C18] border border-[#E8DCCB] dark:border-stone-800 rounded-3xl">
                    <CardContent className="space-y-3">
                      <Package className="w-12 h-12 mx-auto text-[#C59B4B] opacity-60" />
                      <h4 className="font-serif text-xl font-bold text-[#5E2C18] dark:text-stone-200">
                        {ordersSearch || ordersFilter !== 'all' ? 'No Matching Orders Found' : 'No Acquisitions Yet'}
                      </h4>
                      <p className="text-xs text-stone-500 max-w-sm mx-auto">
                        {ordersSearch || ordersFilter !== 'all'
                          ? 'Try adjusting your search terms or status filter.'
                          : 'Explore our catalog of certified Geographical Indication crafts directly empowering master artisans.'}
                      </p>
                      <Button asChild size="sm" className="rounded-full bg-[#701D24] hover:bg-[#8C2B2B] text-white text-xs mt-3">
                        <Link href="/shop">Explore Artisan Shop</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((ord) => {
                      const badge = getStatusBadgeConfig(ord.status);
                      const StatusIcon = badge.icon;

                      return (
                        <Card
                          key={ord.id}
                          className="bg-white dark:bg-[#221C18] border border-[#E8DCCB] dark:border-stone-800 rounded-3xl shadow-sm overflow-hidden hover:border-[#C59B4B]/70 transition-all"
                        >
                          {/* Order Header */}
                          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#FAF7F2] dark:bg-[#2A231F] border-b border-[#E8DCCB] dark:border-stone-800 text-xs">
                            <div className="flex items-center gap-4">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-stone-500 block">Order Placed</span>
                                <span className="font-semibold text-stone-800 dark:text-stone-200">{formatDateSafe(ord.orderDate)}</span>
                              </div>
                              <div className="hidden sm:block">
                                <span className="text-[10px] uppercase font-bold text-stone-500 block">Total Amount</span>
                                <span className="font-serif font-bold text-[#701D24] dark:text-[#E8CA82]">₹{ord.totalAmount.toLocaleString('en-IN')}</span>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase font-bold text-stone-500 block">Order Ref</span>
                                <span className="font-mono font-bold text-stone-700 dark:text-stone-300">{ord.id.toUpperCase()}</span>
                              </div>
                            </div>

                            <span className={cn('inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border', badge.badgeClass)}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              <span>{badge.label}</span>
                            </span>
                          </div>

                          {/* Line Items */}
                          <CardContent className="p-5 space-y-4">
                            {ord.items.map((item, idx) => (
                              <div key={`${ord.id}-item-${idx}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DCCB]/60 dark:border-stone-800 last:border-0 last:pb-0">
                                <div className="flex items-center gap-4">
                                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#E8DCCB] shrink-0">
                                    <Image
                                      src={item.itemImageUrl || '/images/products/clean/handcrafted-terracotta-diya.jpg'}
                                      alt={item.productName}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <div>
                                    <h4 className="font-serif font-bold text-base text-[#221C18] dark:text-[#FAF7F2]">
                                      {item.productName}
                                    </h4>
                                    <p className="text-xs text-stone-500">
                                      Quantity: <span className="font-semibold text-stone-700 dark:text-stone-300">{item.quantity}</span> • Unit Price: ₹{item.unitPrice.toLocaleString('en-IN')}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Link
                                        href={`/product/${item.productId}`}
                                        className="text-[11px] font-semibold text-[#701D24] dark:text-[#E8CA82] hover:underline flex items-center gap-1"
                                      >
                                        <Eye className="w-3 h-3" /> View Product Page
                                      </Link>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                                  <Link
                                    href={`/product/${item.productId}#reviews`}
                                    className="px-3.5 py-1.5 rounded-full border border-[#C59B4B]/60 hover:border-[#701D24] text-xs font-bold text-[#701D24] dark:text-[#E8CA82] hover:bg-[#F3EDE2]/60 transition-colors flex items-center gap-1"
                                  >
                                    <Star className="w-3.5 h-3.5 text-[#C59B4B]" />
                                    <span>Review Craft</span>
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </CardContent>

                          {/* Footer Actions */}
                          <CardFooter className="bg-[#FAF7F2]/40 dark:bg-[#2A231F]/20 px-5 py-3 border-t border-[#E8DCCB] dark:border-stone-800 flex items-center justify-between text-xs">
                            <span className="text-stone-500">
                              Payment: <span className="font-semibold text-emerald-700 dark:text-emerald-400">Verified via Razorpay (100% Escrow Direct)</span>
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(ord);
                                setOrderDetailsOpen(true);
                              }}
                              className="rounded-full border-[#C59B4B]/50 hover:border-[#701D24] text-xs font-bold text-[#5E2C18] dark:text-stone-200"
                            >
                              View Full Order Invoice
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 3: SAVED WISHLIST ================= */}
            {activeTab === 'wishlist' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#701D24] dark:text-[#E8CA82] flex items-center gap-2">
                      <Heart className="w-6 h-6 text-rose-600 fill-rose-600" />
                      <span>My Saved Heirloom Wishlist</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500">
                      Handcrafted creations saved for your personal collection or gifting.
                    </p>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#C59B4B]">
                    {wishlist.length} {wishlist.length === 1 ? 'Artifact' : 'Artifacts'} Saved
                  </span>
                </div>

                {wishlist.length === 0 ? (
                  <Card className="text-center py-16 bg-white dark:bg-[#221C18] border border-[#E8DCCB] dark:border-stone-800 rounded-3xl">
                    <CardContent className="space-y-4">
                      <Heart className="w-14 h-14 mx-auto text-rose-300 dark:text-rose-900 opacity-60" />
                      <h4 className="font-serif text-2xl font-bold text-[#5E2C18] dark:text-stone-200">
                        Your Wishlist is Empty
                      </h4>
                      <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
                        Explore authentic GI crafts, blue pottery, and royal textiles. Click the heart icon on any product card to save it here.
                      </p>
                      <Button asChild className="rounded-full bg-[#701D24] hover:bg-[#8C2B2B] text-white text-xs px-6 mt-2">
                        <Link href="/shop">Explore Collections</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {wishlist.map((prod) => {
                      const img = getProductImage(prod?.images);
                      const safePrice = Number(prod.price) || 0;

                      return (
                        <Card
                          key={prod.id}
                          className="bg-white dark:bg-[#221C18] border border-[#E8DCCB] dark:border-stone-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg hover:border-[#C59B4B] transition-all flex flex-col justify-between group"
                        >
                          <div>
                            {/* Image Header with GI Badge */}
                            <div className="relative aspect-[4/3] bg-[#FAF7F2] overflow-hidden">
                              <Image
                                src={img}
                                alt={prod.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute top-3 left-3 bg-[#FAF7F2]/95 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#C59B4B]/40 text-[10px] font-bold text-[#5E2C18] flex items-center gap-1 uppercase tracking-wider shadow-xs">
                                <ShieldCheck className="w-3 h-3 text-[#C59B4B]" />
                                <span>{prod.region ? `GI • ${prod.region}` : 'GI Certified'}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  removeFromWishlist(prod.id);
                                  toast({ title: 'Removed', description: `${prod.name} removed from your wishlist.` });
                                }}
                                aria-label="Remove from wishlist"
                                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-stone-900/90 text-rose-600 hover:text-rose-700 flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <CardHeader className="p-5 pb-2">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-[#8F6826] dark:text-[#C59B4B]">
                                {prod.category || 'Handicraft'}
                              </div>
                              <CardTitle className="font-serif text-lg font-bold text-[#221C18] dark:text-[#FAF7F2] line-clamp-1">
                                <Link href={`/product/${prod.id}`} className="hover:text-[#701D24] transition-colors">
                                  {t(prod.name)}
                                </Link>
                              </CardTitle>
                              <div className="font-serif font-bold text-xl text-[#701D24] dark:text-[#E8CA82] pt-1">
                                ₹{safePrice.toLocaleString('en-IN')}
                              </div>
                            </CardHeader>
                          </div>

                          <CardFooter className="p-5 pt-3 gap-2">
                            <Button
                              type="button"
                              onClick={() => {
                                addItem(prod);
                                toast({
                                  title: 'Added to Cart 🛍️',
                                  description: `${prod.name} added to your collection cart.`,
                                });
                              }}
                              className="flex-1 rounded-full bg-[#701D24] hover:bg-[#8C2B2B] text-white text-xs font-bold"
                            >
                              <ShoppingBag className="w-3.5 h-3.5 mr-1.5" /> Move to Cart
                            </Button>
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="rounded-full border-[#E8DCCB] text-xs font-semibold"
                            >
                              <Link href={`/product/${prod.id}`}>View</Link>
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 4: ADDRESSES ================= */}
            {activeTab === 'addresses' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#701D24] dark:text-[#E8CA82]">
                      Saved Shipping Addresses
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500">
                      Manage verified shipping destinations for rapid, insurance-backed handloom deliveries.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleOpenAddAddress}
                    className="rounded-full bg-[#701D24] hover:bg-[#8C2B2B] text-white text-xs font-bold px-5"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Add New Address
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {savedAddresses.map((addr) => (
                    <Card
                      key={addr.id}
                      className={cn(
                        'bg-white dark:bg-[#221C18] rounded-3xl p-5 border transition-all relative flex flex-col justify-between shadow-xs',
                        addr.isDefault
                          ? 'border-[#C59B4B] ring-1 ring-[#C59B4B]/30'
                          : 'border-[#E8DCCB] dark:border-stone-800 hover:border-[#C59B4B]/50'
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F3EDE2] text-[#701D24] dark:bg-stone-800 dark:text-[#E8CA82]">
                            {addr.label || 'Home'}
                          </span>
                          {addr.isDefault && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#701D24] text-white shadow-xs">
                              <Check className="w-3 h-3" /> Default Shipping Destination
                            </span>
                          )}
                        </div>

                        <h4 className="font-serif font-bold text-lg text-[#221C18] dark:text-[#FAF7F2]">
                          {addr.fullName}
                        </h4>
                        <div className="text-xs text-stone-600 dark:text-stone-300 space-y-0.5 mt-2">
                          <p>{addr.addressLine1}</p>
                          {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                          <p>{addr.city}, {addr.state} - <span className="font-mono font-bold">{addr.zipCode}</span></p>
                          <p className="text-stone-500 pt-1">Phone: {addr.phone || 'Not provided'}</p>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-[#E8DCCB]/60 dark:border-stone-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditAddress(addr)}
                            className="text-xs font-semibold text-[#5E2C18] dark:text-stone-300 hover:text-[#701D24] p-0 h-auto"
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                          </Button>
                          <span className="text-stone-300">•</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 p-0 h-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                          </Button>
                        </div>

                        {!addr.isDefault && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="rounded-full text-[11px] font-semibold h-7 border-[#E8DCCB] hover:border-[#701D24]"
                          >
                            Make Default
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* ================= TAB 5: REVIEWS ================= */}
            {activeTab === 'reviews' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#701D24] dark:text-[#E8CA82] flex items-center gap-2">
                      <Star className="w-6 h-6 text-[#C59B4B] fill-[#C59B4B]" />
                      <span>My Artisan Reviews & Feedback</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500">
                      Authentic feedback delivered directly to master craftsmen across India.
                    </p>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#C59B4B]">
                    {reviewsList.length} Verified {reviewsList.length === 1 ? 'Review' : 'Reviews'}
                  </span>
                </div>

                {reviewsLoading ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-8 h-8 mx-auto border-2 border-[#701D24] border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-stone-500">Loading your submitted reviews...</p>
                  </div>
                ) : reviewsList.length === 0 ? (
                  <Card className="text-center py-16 bg-white dark:bg-[#221C18] border border-[#E8DCCB] dark:border-stone-800 rounded-3xl">
                    <CardContent className="space-y-3">
                      <Star className="w-12 h-12 mx-auto text-[#C59B4B] opacity-60" />
                      <h4 className="font-serif text-xl font-bold text-[#5E2C18] dark:text-stone-200">
                        No Reviews Submitted Yet
                      </h4>
                      <p className="text-xs text-stone-500 max-w-md mx-auto">
                        Share your thoughts on acquired pieces. Your feedback helps rural artisan guilds maintain centuries-old craft standards.
                      </p>
                      <Button
                        type="button"
                        onClick={() => changeTab('orders')}
                        className="rounded-full bg-[#701D24] hover:bg-[#8C2B2B] text-white text-xs mt-2"
                      >
                        Review Recent Purchases
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {reviewsList.map((rev) => (
                      <Card
                        key={rev.id}
                        className="bg-white dark:bg-[#221C18] border border-[#E8DCCB] dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-sm hover:border-[#C59B4B]/60 transition-all space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3.5">
                            <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#E8DCCB] shrink-0">
                              <Image
                                src={rev.productImage || '/images/products/clean/handcrafted-terracotta-diya.jpg'}
                                alt={rev.productName || 'Product'}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <h4 className="font-serif font-bold text-base text-[#221C18] dark:text-[#FAF7F2]">
                                {rev.productName || 'Handcrafted Artifact'}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className="flex items-center gap-0.5 text-[#C59B4B]">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={cn(
                                        'w-3.5 h-3.5',
                                        star <= rev.rating ? 'fill-[#C59B4B]' : 'text-stone-300'
                                      )}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-stone-500">• {formatDateSafe(rev.createdAt)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditReview(rev)}
                              className="text-xs font-semibold text-[#701D24] dark:text-[#E8CA82] hover:bg-[#F3EDE2]/60"
                            >
                              <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setReviewToDeleteId(rev.id);
                                setDeleteConfirmOpen(true);
                              }}
                              className="text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                            </Button>
                          </div>
                        </div>

                        {rev.title && (
                          <h5 className="font-serif font-bold text-sm text-[#701D24] dark:text-[#E8CA82]">
                            &ldquo;{rev.title}&rdquo;
                          </h5>
                        )}

                        <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                          {rev.comment}
                        </p>

                        {/* Artisan Response if available */}
                        {rev.artisanResponse && (
                          <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#2A231F] border-l-4 border-[#C59B4B] space-y-1 mt-3">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#701D24] dark:text-[#E8CA82]">
                              <MessageSquare className="w-3.5 h-3.5 text-[#C59B4B]" />
                              <span>Response from Master Artisan Guild</span>
                              {rev.artisanRespondedAt && (
                                <span className="text-stone-400 font-normal">({formatDateSafe(rev.artisanRespondedAt)})</span>
                              )}
                            </div>
                            <p className="text-xs text-stone-600 dark:text-stone-300 italic leading-relaxed">
                              &ldquo;{rev.artisanResponse}&rdquo;
                            </p>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 6: NOTIFICATIONS ================= */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#701D24] dark:text-[#E8CA82]">
                      Notifications & Updates
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500">
                      Real-time alerts for your shipments, artisan responses, and guild updates.
                    </p>
                  </div>
                  {notificationsList.some((n) => !n.read) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleMarkAllNotificationsRead}
                      className="rounded-full text-xs font-semibold border-[#C59B4B]/40 hover:border-[#701D24]"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Mark All as Read
                    </Button>
                  )}
                </div>

                {notificationsLoading ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-8 h-8 mx-auto border-2 border-[#701D24] border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-stone-500">Retrieving notification updates...</p>
                  </div>
                ) : notificationsList.length === 0 ? (
                  <Card className="text-center py-16 bg-white dark:bg-[#221C18] border border-[#E8DCCB] dark:border-stone-800 rounded-3xl">
                    <CardContent className="space-y-3">
                      <Bell className="w-12 h-12 mx-auto text-[#C59B4B] opacity-60" />
                      <h4 className="font-serif text-xl font-bold text-[#5E2C18] dark:text-stone-200">
                        All Caught Up!
                      </h4>
                      <p className="text-xs text-stone-500 max-w-sm mx-auto">
                        You have no new alerts. Important shipment and artisan communications will appear here.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {notificationsList.map((notif) => (
                      <div
                        key={notif.id}
                        className={cn(
                          'p-4 sm:p-5 rounded-2xl border transition-all flex items-start gap-4',
                          notif.read
                            ? 'bg-white dark:bg-[#221C18] border-[#E8DCCB] dark:border-stone-800 opacity-80'
                            : 'bg-[#FAF7F2] dark:bg-[#2A231F] border-[#C59B4B] shadow-xs'
                        )}
                      >
                        <div className="w-9 h-9 rounded-full bg-[#F3EDE2] dark:bg-stone-800 border border-[#C59B4B]/30 flex items-center justify-center text-[#701D24] dark:text-[#E8CA82] shrink-0 mt-0.5">
                          <Bell className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-serif font-bold text-sm text-[#221C18] dark:text-[#FAF7F2]">
                              {notif.title}
                            </h4>
                            <span className="text-[10px] text-stone-400 shrink-0">
                              {formatDateSafe(notif.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                            {notif.message}
                          </p>

                          <div className="pt-2 flex items-center gap-3 text-xs">
                            {notif.link && (
                              <Link
                                href={notif.link}
                                className="font-semibold text-[#701D24] dark:text-[#E8CA82] hover:underline flex items-center gap-1"
                              >
                                View Update <ExternalLink className="w-3 h-3" />
                              </Link>
                            )}
                            {!notif.read && (
                              <button
                                type="button"
                                onClick={() => handleMarkAsRead(notif.id)}
                                className="text-stone-400 hover:text-stone-700 text-[11px] underline cursor-pointer"
                              >
                                Mark as Read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 7: PROFILE SETTINGS ================= */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#701D24] dark:text-[#E8CA82]">
                      Profile & Craft Preferences
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500">
                      Personalize your profile and craft recommendations.
                    </p>
                  </div>

                  {!isEditingProfile ? (
                    <Button
                      type="button"
                      onClick={() => {
                        setIsEditingProfile(true);
                        setProfileErrors({});
                      }}
                      className="rounded-full bg-[#701D24] hover:bg-[#8C2B2B] text-white font-bold text-xs px-5 shadow-sm w-fit flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelEditProfile}
                        disabled={isSavingProfile}
                        className="rounded-full border-[#E8DCCB] dark:border-stone-800 text-xs px-4"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        className="rounded-full bg-[#701D24] hover:bg-[#8C2B2B] text-white font-bold text-xs px-6 shadow-sm flex items-center gap-1.5"
                      >
                        {isSavingProfile ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  {/* Account Credentials Card */}
                  <Card className="bg-white dark:bg-[#221C18] border border-[#E8DCCB] dark:border-stone-800 rounded-3xl p-6 shadow-sm space-y-6">
                    <div className="flex items-center gap-4 pb-4 border-b border-[#E8DCCB] dark:border-stone-800">
                      <Avatar className="h-16 w-16 border-2 border-[#C59B4B] shadow-sm">
                        <AvatarImage src={user?.imageUrl} alt={user?.fullName || 'Collector'} />
                        <AvatarFallback className="bg-[#701D24] text-white font-serif font-bold text-xl">
                          {profileFirstName?.[0] || user?.firstName?.[0] || 'V'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h4 className="font-serif font-bold text-lg text-[#221C18] dark:text-[#FAF7F2] truncate">
                          {[profileFirstName, profileLastName].filter(Boolean).join(' ') ||
                            user?.fullName ||
                            'Art Connoisseur'}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mt-0.5">
                          <span>{user?.primaryEmailAddress?.emailAddress || 'No email registered'}</span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-stone-400 font-medium bg-stone-100 dark:bg-stone-900 px-2 py-0.5 rounded-full border border-stone-200 dark:border-stone-800">
                            <Lock className="w-2.5 h-2.5" /> Managed by Clerk • Read-only
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold uppercase tracking-wider text-[#C59B4B]">
                          <ShieldCheck className="w-3 h-3" /> Registered Customer Patron
                        </span>
                      </div>
                    </div>

                    {/* View Mode Fields */}
                    {!isEditingProfile ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#2A231F] border border-[#E8DCCB] dark:border-stone-800">
                          <p className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                            First Name
                          </p>
                          <p className="text-sm font-semibold text-[#221C18] dark:text-[#FAF7F2] mt-1">
                            {profileFirstName || '—'}
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#2A231F] border border-[#E8DCCB] dark:border-stone-800">
                          <p className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                            Last Name
                          </p>
                          <p className="text-sm font-semibold text-[#221C18] dark:text-[#FAF7F2] mt-1">
                            {profileLastName || '—'}
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#2A231F] border border-[#E8DCCB] dark:border-stone-800">
                          <p className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                            Contact Phone Number
                          </p>
                          <p className="text-sm font-semibold text-[#221C18] dark:text-[#FAF7F2] mt-1 font-mono">
                            {profilePhone || 'Not provided'}
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#2A231F] border border-[#E8DCCB] dark:border-stone-800">
                          <p className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                            Home State / Region
                          </p>
                          <p className="text-sm font-semibold text-[#221C18] dark:text-[#FAF7F2] mt-1">
                            {profileState || 'Not selected'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Edit Mode Form Inputs */
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="prof-fn" className="text-xs font-bold text-stone-700 dark:text-stone-300">
                              First Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="prof-fn"
                              placeholder="e.g. Aayush"
                              value={profileFirstName}
                              onChange={(e) => {
                                setProfileFirstName(e.target.value);
                                if (profileErrors.firstName) {
                                  setProfileErrors((prev) => ({ ...prev, firstName: undefined }));
                                }
                              }}
                              className={cn(
                                'bg-[#FAF7F2] dark:bg-[#2A231F] border-[#E8DCCB] dark:border-stone-800 rounded-xl text-base md:text-sm transition-colors',
                                profileErrors.firstName && 'border-red-500 focus-visible:ring-red-500'
                              )}
                            />
                            {profileErrors.firstName && (
                              <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                {profileErrors.firstName}
                              </p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="prof-ln" className="text-xs font-bold text-stone-700 dark:text-stone-300">
                              Last Name
                            </Label>
                            <Input
                              id="prof-ln"
                              placeholder="e.g. Kumar Singh"
                              value={profileLastName}
                              onChange={(e) => {
                                setProfileLastName(e.target.value);
                                if (profileErrors.lastName) {
                                  setProfileErrors((prev) => ({ ...prev, lastName: undefined }));
                                }
                              }}
                              className={cn(
                                'bg-[#FAF7F2] dark:bg-[#2A231F] border-[#E8DCCB] dark:border-stone-800 rounded-xl text-base md:text-sm transition-colors',
                                profileErrors.lastName && 'border-red-500 focus-visible:ring-red-500'
                              )}
                            />
                            {profileErrors.lastName && (
                              <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                {profileErrors.lastName}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="prof-ph" className="text-xs font-bold text-stone-700 dark:text-stone-300">
                              Contact Phone Number
                            </Label>
                            <Input
                              id="prof-ph"
                              placeholder="+91 98765 43210"
                              value={profilePhone}
                              onChange={(e) => {
                                setProfilePhone(e.target.value);
                                if (profileErrors.phone) {
                                  setProfileErrors((prev) => ({ ...prev, phone: undefined }));
                                }
                              }}
                              className={cn(
                                'bg-[#FAF7F2] dark:bg-[#2A231F] border-[#E8DCCB] dark:border-stone-800 rounded-xl text-base md:text-sm transition-colors',
                                profileErrors.phone && 'border-red-500 focus-visible:ring-red-500'
                              )}
                            />
                            {profileErrors.phone && (
                              <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                {profileErrors.phone}
                              </p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="prof-st" className="text-xs font-bold text-stone-700 dark:text-stone-300">
                              Home State / Region
                            </Label>
                            <Select value={profileState} onValueChange={setProfileState}>
                              <SelectTrigger id="prof-st" className="bg-[#FAF7F2] dark:bg-[#2A231F] border-[#E8DCCB] dark:border-stone-800 rounded-xl text-base md:text-sm">
                                <SelectValue placeholder="Select State" />
                              </SelectTrigger>
                              <SelectContent className="max-h-64">
                                {INDIAN_STATES.map((st) => (
                                  <SelectItem key={st} value={st}>{st}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>

                  {/* Craft Preferences Card */}
                  <Card className="bg-white dark:bg-[#221C18] border border-[#E8DCCB] dark:border-stone-800 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div>
                        <CardTitle className="font-serif text-lg text-[#701D24] dark:text-[#E8CA82]">
                          Heritage Craft Interests
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Select traditions you love to receive tailored exhibition alerts and rare drop notifications.
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="w-fit text-[10px] font-semibold text-[#701D24] dark:text-[#E8CA82] border-[#C59B4B]/40">
                        {selectedInterests.length} selected
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {CRAFT_PREFERENCES.map((craft) => {
                        const isSelected = selectedInterests.includes(craft.name);
                        return (
                          <button
                            key={craft.id}
                            type="button"
                            onClick={() => toggleInterest(craft.name)}
                            className={cn(
                              'p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer',
                              isSelected
                                ? 'bg-[#701D24] text-white border-[#701D24] shadow-xs'
                                : 'bg-[#FAF7F2] dark:bg-[#2A231F] text-stone-700 dark:text-stone-300 border-[#E8DCCB] dark:border-stone-800 hover:border-[#C59B4B]'
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-lg">{craft.icon}</span>
                              <div>
                                <div className="text-xs font-bold line-clamp-1">{craft.name}</div>
                                <div className={cn('text-[10px]', isSelected ? 'text-amber-200' : 'text-stone-400')}>
                                  {craft.region}
                                </div>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 shrink-0 text-amber-300" />}
                          </button>
                        );
                      })}
                    </div>
                  </Card>

                  {isEditingProfile && (
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelEditProfile}
                        disabled={isSavingProfile}
                        className="rounded-full border-[#E8DCCB] dark:border-stone-800 text-xs px-6"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSavingProfile}
                        className="rounded-full bg-[#701D24] hover:bg-[#8C2B2B] text-white font-bold text-xs px-8 shadow-md flex items-center gap-1.5"
                      >
                        {isSavingProfile ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Saving Changes...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </div>
                  )}
                </form>
              </div>
            )}
          </main>
        </div>

        {/* ================= ORDER DETAILS MODAL ================= */}
        <Dialog open={orderDetailsOpen} onOpenChange={setOrderDetailsOpen}>
          <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto bg-white dark:bg-[#221C18] border border-[#E8DCCB] dark:border-stone-800 rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl text-[#701D24] dark:text-[#E8CA82]">
                Order Details & Lineage
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500">
                Official Viraasat Acquisition Invoice & Tracking Reference
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-5 text-xs text-stone-700 dark:text-stone-300">
                <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#2A231F] border border-[#E8DCCB] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-stone-500 text-[10px]">Order ID</span>
                    <span className="font-mono font-bold text-[#701D24] dark:text-[#E8CA82]">{selectedOrder.id.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Order Placed</span>
                    <span className="font-semibold">{formatDateSafe(selectedOrder.orderDate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Status</span>
                    <Badge variant="outline" className="text-[10px] font-bold border-[#C59B4B] text-[#701D24] dark:text-[#E8CA82]">
                      {selectedOrder.status}
                    </Badge>
                  </div>
                </div>

                {/* Line Items */}
                <div className="space-y-3">
                  <h4 className="font-serif font-bold text-sm text-[#701D24] dark:text-[#E8CA82]">Acquired Items</h4>
                  {selectedOrder.items.map((it, idx) => (
                    <div key={`modal-item-${idx}`} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white shrink-0">
                          <Image
                            src={it.itemImageUrl || '/images/products/clean/handcrafted-terracotta-diya.jpg'}
                            alt={it.productName}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold line-clamp-1">{it.productName}</div>
                          <div className="text-[11px] text-stone-500">Qty: {it.quantity}</div>
                        </div>
                      </div>
                      <div className="font-serif font-bold text-[#701D24] dark:text-[#E8CA82]">
                        ₹{(it.unitPrice * it.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipping Destination */}
                <div className="space-y-1">
                  <h4 className="font-serif font-bold text-sm text-[#701D24] dark:text-[#E8CA82]">Delivery Destination</h4>
                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-[11px] space-y-0.5">
                    <p className="font-bold">{selectedOrder.shippingAddress?.fullName || user?.fullName}</p>
                    <p>{selectedOrder.shippingAddress?.addressLine1 || 'Heritage Destination'}</p>
                    <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.zipCode}</p>
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#2A231F] border border-[#E8DCCB] space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Subtotal</span>
                    <span>₹{selectedOrder.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Artisan Guild Direct Payout (85%+)</span>
                    <span className="text-emerald-700 font-bold">100% Escrow Secured</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Insured Handloom Freight</span>
                    <span className="text-emerald-700 font-bold">Complimentary</span>
                  </div>
                  <Separator className="my-1 bg-[#E8DCCB]" />
                  <div className="flex justify-between font-bold text-sm text-[#701D24] dark:text-[#E8CA82]">
                    <span>Total Paid</span>
                    <span>₹{selectedOrder.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                onClick={() => setOrderDetailsOpen(false)}
                className="w-full rounded-full bg-[#701D24] hover:bg-[#8C2B2B] text-white text-xs"
              >
                Close Order Record
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ================= ADDRESS ADD/EDIT MODAL ================= */}
        <Dialog open={addressModalOpen} onOpenChange={setAddressModalOpen}>
          <DialogContent className="max-w-lg bg-white dark:bg-[#221C18] border border-[#E8DCCB] dark:border-stone-800 rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl text-[#701D24] dark:text-[#E8CA82]">
                {editingAddressId ? 'Edit Shipping Address' : 'Add New Shipping Destination'}
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500">
                Please enter accurate postal details for secure handloom delivery.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveAddress} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="addr-fn" className="text-xs font-bold">Recipient Full Name *</Label>
                  <Input
                    id="addr-fn"
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    className="rounded-xl text-base md:text-sm bg-[#FAF7F2] dark:bg-[#2A231F] border-[#E8DCCB]"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="addr-ph" className="text-xs font-bold">Phone Number *</Label>
                  <Input
                    id="addr-ph"
                    required
                    placeholder="+91 98765 43210"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="rounded-xl text-base md:text-sm bg-[#FAF7F2] dark:bg-[#2A231F] border-[#E8DCCB]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="addr-l1" className="text-xs font-bold">Address Line 1 (Street/House/Haveli) *</Label>
                <Input
                  id="addr-l1"
                  required
                  placeholder="e.g. 42 Heritage Lane, C-Scheme"
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                  className="rounded-xl text-base md:text-sm bg-[#FAF7F2] dark:bg-[#2A231F] border-[#E8DCCB]"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="addr-l2" className="text-xs font-bold">Address Line 2 (Apartment/Landmark)</Label>
                <Input
                  id="addr-l2"
                  placeholder="Near City Palace"
                  value={addressForm.addressLine2}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                  className="rounded-xl text-base md:text-sm bg-[#FAF7F2] dark:bg-[#2A231F] border-[#E8DCCB]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="addr-city" className="text-xs font-bold">City *</Label>
                  <Input
                    id="addr-city"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="rounded-xl text-base md:text-sm bg-[#FAF7F2] dark:bg-[#2A231F] border-[#E8DCCB]"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="addr-state" className="text-xs font-bold">State *</Label>
                  <Select
                    value={addressForm.state}
                    onValueChange={(val) => setAddressForm({ ...addressForm, state: val })}
                  >
                    <SelectTrigger id="addr-state" className="rounded-xl text-base md:text-sm bg-[#FAF7F2] dark:bg-[#2A231F] border-[#E8DCCB]">
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {INDIAN_STATES.map((st) => (
                        <SelectItem key={st} value={st}>{st}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="addr-zip" className="text-xs font-bold">PIN Code *</Label>
                  <Input
                    id="addr-zip"
                    required
                    maxLength={6}
                    placeholder="302001"
                    value={addressForm.zipCode}
                    onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value.replace(/\D/g, '') })}
                    className="rounded-xl text-base md:text-sm bg-[#FAF7F2] dark:bg-[#2A231F] border-[#E8DCCB]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="addr-def"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="rounded border-[#E8DCCB] text-[#701D24] focus:ring-[#701D24]"
                  />
                  <Label htmlFor="addr-def" className="text-xs text-stone-600 dark:text-stone-300 cursor-pointer">
                    Set as default shipping address
                  </Label>
                </div>

                <div className="flex items-center gap-1.5">
                  {(['Home', 'Studio', 'Office', 'Gallery'] as const).map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setAddressForm({ ...addressForm, label: lbl })}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer',
                        addressForm.label === lbl
                          ? 'bg-[#701D24] text-white border-[#701D24]'
                          : 'bg-[#FAF7F2] text-stone-600 border-[#E8DCCB]'
                      )}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddressModalOpen(false)}
                  className="rounded-full text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-full bg-[#701D24] hover:bg-[#8C2B2B] text-white text-xs font-bold px-6"
                >
                  Save Address
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ================= EDIT REVIEW MODAL ================= */}
        <Dialog open={editReviewModalOpen} onOpenChange={setEditReviewModalOpen}>
          <DialogContent className="max-w-md bg-white dark:bg-[#221C18] border border-[#E8DCCB] dark:border-stone-800 rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl text-[#701D24] dark:text-[#E8CA82]">
                Edit Your Artisan Review
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500">
                Update your verified rating and feedback for the artisan guild.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveReview} className="space-y-4 text-xs">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Star Rating (1 - 5 Stars) *</Label>
                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: s })}
                      className="cursor-pointer transition-transform hover:scale-125"
                    >
                      <Star
                        className={cn(
                          'w-6 h-6',
                          s <= reviewForm.rating ? 'text-[#C59B4B] fill-[#C59B4B]' : 'text-stone-300'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="rev-title" className="text-xs font-bold">Review Headline (Optional)</Label>
                <Input
                  id="rev-title"
                  placeholder="e.g. Masterful handloom weave, incredible color"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  className="rounded-xl text-base md:text-sm bg-[#FAF7F2] dark:bg-[#2A231F] border-[#E8DCCB]"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="rev-comment" className="text-xs font-bold">Written Craft Feedback *</Label>
                <Textarea
                  id="rev-comment"
                  required
                  rows={4}
                  placeholder="Detail your appreciation of the craft, texture, packaging, or heritage note..."
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  className="rounded-xl text-base md:text-sm bg-[#FAF7F2] dark:bg-[#2A231F] border-[#E8DCCB]"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditReviewModalOpen(false)}
                  className="rounded-full text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-full bg-[#701D24] hover:bg-[#8C2B2B] text-white text-xs font-bold px-6"
                >
                  Save Review
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ================= CONFIRM DELETE REVIEW DIALOG ================= */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="max-w-sm bg-white dark:bg-[#221C18] border border-[#E8DCCB] rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl text-[#701D24]">Delete Review?</DialogTitle>
              <DialogDescription className="text-xs text-stone-500">
                Are you sure you want to delete this verified review? This will remove your rating from the product&apos;s score.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmOpen(false)}
                className="rounded-full text-xs"
              >
                Keep Review
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleDeleteReview}
                className="rounded-full bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}

export default function BuyerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center bg-[#FAF7F2]">
          <div className="w-8 h-8 border-2 border-[#701D24] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CustomerDashboardContent />
    </Suspense>
  );
}
