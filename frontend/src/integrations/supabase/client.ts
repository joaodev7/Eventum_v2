/**
 * Eventum API Adapter (Substitui completamente o Supabase Client)
 * Todas as requisições passam pela API própria ASP.NET Core 8 com Bearer Token.
 */
import { api } from '@/services/api';
import type { Database } from './types';

// Helper de query builder compatível com a interface do Supabase
class ApiQueryBuilder {
  private tableName: string;
  private filters: { field: string; op: string; value: any }[] = [];
  private orderConfig?: { column: string; ascending: boolean };
  private isSingle = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = '*') {
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, op: 'eq', value });
    return this;
  }

  neq(field: string, value: any) {
    this.filters.push({ field, op: 'neq', value });
    return this;
  }

  in(field: string, values: any[]) {
    this.filters.push({ field, op: 'in', value: values });
    return this;
  }

  order(column: string, { ascending = true }: { ascending?: boolean } = {}) {
    this.orderConfig = { column, ascending };
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    return this;
  }

  // Execução da consulta GET
  async then(resolve: (value: { data: any; error: any }) => void, reject?: (reason: any) => void) {
    try {
      const eventIdFilter = this.filters.find(f => f.field === 'event_id')?.value;
      const idFilter = this.filters.find(f => f.field === 'id')?.value;
      const userIdFilter = this.filters.find(f => f.field === 'user_id')?.value;

      let result: any = null;

      switch (this.tableName) {
        case 'events':
          if (idFilter && typeof idFilter === 'string') {
            const { data } = await api.get(`/events/${idFilter}`);
            result = this.isSingle ? data : [data];
          } else {
            const { data } = await api.get('/events');
            result = data;
          }
          break;

        case 'event_users':
          if (eventIdFilter) {
            const { data } = await api.get(`/events/${eventIdFilter}/users`);
            result = data;
          } else if (userIdFilter) {
            const { data } = await api.get('/events');
            result = (data || []).map((e: any) => ({ event_id: e.id, user_id: userIdFilter, role: e.userRole }));
          } else {
            result = [];
          }
          break;

        case 'guests':
          if (eventIdFilter) {
            const { data } = await api.get(`/events/${eventIdFilter}/guests`);
            result = idFilter ? data.filter((g: any) => g.id === idFilter) : data;
          } else if (idFilter) {
            result = [];
          }
          break;

        case 'guest_companions':
          if (eventIdFilter) {
            const { data: guests } = await api.get(`/events/${eventIdFilter}/guests`);
            const allComps: any[] = [];
            (guests || []).forEach((g: any) => {
              if (g.companionsList) allComps.push(...g.companionsList);
            });
            result = allComps;
          }
          break;

        case 'tables':
          if (eventIdFilter) {
            const { data } = await api.get(`/events/${eventIdFilter}/tables`);
            result = idFilter ? data.filter((t: any) => t.id === idFilter) : data;
          }
          break;

        case 'gifts':
          if (eventIdFilter) {
            const { data } = await api.get(`/events/${eventIdFilter}/gifts`);
            result = idFilter ? data.filter((g: any) => g.id === idFilter) : data;
          }
          break;

        case 'gift_payments':
          if (eventIdFilter) {
            const { data } = await api.get(`/events/${eventIdFilter}/gift-payments`);
            result = data;
          }
          break;

        case 'pix_config':
          if (eventIdFilter) {
            const { data } = await api.get(`/events/${eventIdFilter}/pix`);
            result = data && data.pixKey ? (this.isSingle ? data : [data]) : (this.isSingle ? null : []);
          }
          break;

        case 'expenses':
          if (eventIdFilter) {
            const { data } = await api.get(`/events/${eventIdFilter}/expenses`);
            result = data;
          }
          break;

        case 'expense_categories':
          if (eventIdFilter) {
            const { data } = await api.get(`/events/${eventIdFilter}/expense-categories`);
            result = data;
          }
          break;

        case 'suppliers':
          if (eventIdFilter) {
            const { data } = await api.get(`/events/${eventIdFilter}/suppliers`);
            result = data;
          }
          break;

        case 'subscription_plans':
          {
            const { data } = await api.get('/subscriptions/plans');
            result = data;
          }
          break;

        case 'subscriptions':
          {
            const { data } = await api.get('/subscriptions/current');
            result = this.isSingle ? data : (data ? [data] : []);
          }
          break;

        default:
          result = [];
          break;
      }

      if (Array.isArray(result) && this.isSingle) {
        result = result.length > 0 ? result[0] : null;
      }

      resolve({ data: result, error: null });
    } catch (err: any) {
      resolve({ data: null, error: err });
    }
  }

  // Inserção
  async insert(payload: any) {
    try {
      const items = Array.isArray(payload) ? payload : [payload];
      const results: any[] = [];

      for (const item of items) {
        const eventId = item.event_id || item.eventId;
        let res: any = null;

        switch (this.tableName) {
          case 'events':
            res = (await api.post('/events', {
              eventName: item.event_name || item.eventName,
              eventType: item.event_type || item.eventType || 'wedding',
              eventDate: item.event_date || item.eventDate,
              eventTime: item.event_time || item.eventTime,
              venueName: item.venue_name || item.venueName,
              venueAddress: item.venue_address || item.venueAddress
            })).data;
            break;

          case 'guests':
            res = (await api.post(`/events/${eventId}/guests`, {
              name: item.name,
              email: item.email,
              phone: item.phone,
              guestGroup: item.guest_group || item.guestGroup || 'other',
              tableId: item.table_id || item.tableId,
              notes: item.notes,
              companions: item.companions
            })).data;
            break;

          case 'tables':
            res = (await api.post(`/events/${eventId}/tables`, {
              name: item.name,
              capacity: item.capacity || 10,
              description: item.description
            })).data;
            break;

          case 'gifts':
            res = (await api.post(`/events/${eventId}/gifts`, {
              name: item.name,
              description: item.description,
              value: item.value,
              imageUrl: item.image_url || item.imageUrl,
              isFlexibleValue: item.is_flexible_value ?? false,
              minValue: item.min_value ?? null
            })).data;
            break;

          case 'expenses':
            res = (await api.post(`/events/${eventId}/expenses`, {
              categoryId: item.category_id || item.categoryId,
              description: item.description,
              amount: item.amount,
              paidAmount: item.paid_amount || 0,
              status: item.status || 'pending',
              dueDate: item.due_date,
              vendorName: item.vendor_name,
              notes: item.notes
            })).data;
            break;

          case 'expense_categories':
            res = (await api.post(`/events/${eventId}/expense-categories`, {
              name: item.name,
              color: item.color,
              icon: item.icon
            })).data;
            break;

          case 'suppliers':
            res = (await api.post(`/events/${eventId}/suppliers`, {
              name: item.name,
              category: item.category,
              contactName: item.contact_name,
              phone: item.phone,
              email: item.email,
              website: item.website,
              instagram: item.instagram,
              address: item.address,
              notes: item.notes,
              contracted: item.contracted ?? false,
              contractValue: item.contract_value ?? 0,
              paidAmount: item.paid_amount ?? 0
            })).data;
            break;
        }

        results.push(res);
      }

      const finalData = Array.isArray(payload) ? results : (results[0] || null);
      return { data: finalData, error: null, select: () => ({ single: () => Promise.resolve({ data: finalData, error: null }) }) };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  // Atualização
  async update(payload: any) {
    return {
      eq: (field: string, value: any) => this.executeUpdate(payload, field, value)
    };
  }

  private async executeUpdate(payload: any, filterField: string, filterValue: any) {
    try {
      const eventIdFilter = this.filters.find(f => f.field === 'event_id')?.value || payload.event_id || payload.eventId;
      const id = filterField === 'id' ? filterValue : null;

      let result: any = null;

      switch (this.tableName) {
        case 'events':
          if (id) {
            result = (await api.put(`/events/${id}`, payload)).data;
          }
          break;

        case 'guests':
          if (eventIdFilter && id) {
            result = (await api.put(`/events/${eventIdFilter}/guests/${id}`, payload)).data;
          }
          break;

        case 'tables':
          if (eventIdFilter && id) {
            result = (await api.put(`/events/${eventIdFilter}/tables/${id}`, payload)).data;
          }
          break;

        case 'gifts':
          if (eventIdFilter && id) {
            result = (await api.put(`/events/${eventIdFilter}/gifts/${id}`, payload)).data;
          }
          break;

        case 'pix_config':
          if (eventIdFilter) {
            result = (await api.put(`/events/${eventIdFilter}/pix`, {
              pixKey: payload.pix_key || payload.pixKey,
              recipientName: payload.recipient_name || payload.recipientName,
              qrCodeUrl: payload.qr_code_url || payload.qrCodeUrl
            })).data;
          }
          break;

        case 'expenses':
          if (eventIdFilter && id) {
            result = (await api.put(`/events/${eventIdFilter}/expenses/${id}`, payload)).data;
          }
          break;

        case 'suppliers':
          if (eventIdFilter && id) {
            result = (await api.put(`/events/${eventIdFilter}/suppliers/${id}`, payload)).data;
          }
          break;
      }

      return { data: result, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  // Exclusão
  async delete() {
    return {
      eq: async (field: string, value: any) => {
        try {
          const eventIdFilter = this.filters.find(f => f.field === 'event_id')?.value;
          const id = field === 'id' ? value : null;

          switch (this.tableName) {
            case 'events':
              if (id) await api.delete(`/events/${id}`);
              break;
            case 'guests':
              if (eventIdFilter && id) await api.delete(`/events/${eventIdFilter}/guests/${id}`);
              break;
            case 'tables':
              if (eventIdFilter && id) await api.delete(`/events/${eventIdFilter}/tables/${id}`);
              break;
            case 'gifts':
              if (eventIdFilter && id) await api.delete(`/events/${eventIdFilter}/gifts/${id}`);
              break;
            case 'expenses':
              if (eventIdFilter && id) await api.delete(`/events/${eventIdFilter}/expenses/${id}`);
              break;
            case 'expense_categories':
              if (eventIdFilter && id) await api.delete(`/events/${eventIdFilter}/expense-categories/${id}`);
              break;
            case 'suppliers':
              if (eventIdFilter && id) await api.delete(`/events/${eventIdFilter}/suppliers/${id}`);
              break;
          }
          return { data: true, error: null };
        } catch (err: any) {
          return { data: null, error: err };
        }
      }
    };
  }
}

export const supabase = {
  from: (table: string) => new ApiQueryBuilder(table),

  auth: {
    signInWithPassword: async ({ email, password }: any) => {
      try {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('@eventum:token', data.accessToken);
        localStorage.setItem('@eventum:refreshToken', data.refreshToken);
        localStorage.setItem('@eventum:user', JSON.stringify(data.user));
        return { data: { user: data.user, session: { access_token: data.accessToken } }, error: null };
      } catch (err: any) {
        return { data: { user: null, session: null }, error: new Error(err.response?.data?.error || err.message) };
      }
    },

    signUp: async ({ email, password, options }: any) => {
      try {
        const fullName = options?.data?.full_name || '';
        const { data } = await api.post('/auth/register', { email, password, fullName });
        localStorage.setItem('@eventum:token', data.accessToken);
        localStorage.setItem('@eventum:refreshToken', data.refreshToken);
        localStorage.setItem('@eventum:user', JSON.stringify(data.user));
        return { data: { user: data.user, session: { access_token: data.accessToken } }, error: null };
      } catch (err: any) {
        return { data: { user: null, session: null }, error: new Error(err.response?.data?.error || err.message) };
      }
    },

    signOut: async () => {
      const refreshToken = localStorage.getItem('@eventum:refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken }).catch(() => {});
      }
      localStorage.removeItem('@eventum:token');
      localStorage.removeItem('@eventum:refreshToken');
      localStorage.removeItem('@eventum:user');
      return { error: null };
    },

    getSession: async () => {
      const token = localStorage.getItem('@eventum:token');
      const userStr = localStorage.getItem('@eventum:user');
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          return { data: { session: { access_token: token, user } }, error: null };
        } catch {
          return { data: { session: null }, error: null };
        }
      }
      return { data: { session: null }, error: null };
    },

    getUser: async () => {
      const token = localStorage.getItem('@eventum:token');
      if (!token) return { data: { user: null }, error: null };
      try {
        const { data } = await api.get('/auth/me');
        return { data: { user: { ...data, user_metadata: { full_name: data.fullName, avatar_url: data.avatarUrl } } }, error: null };
      } catch (err) {
        return { data: { user: null }, error: err };
      }
    },

    updateUser: async (payload: any) => {
      try {
        const updateBody: any = {};
        if (payload.password) updateBody.newPassword = payload.password;
        if (payload.data?.full_name) updateBody.fullName = payload.data.full_name;
        if (payload.data?.avatar_url) updateBody.avatarUrl = payload.data.avatar_url;

        const { data } = await api.put('/auth/profile', updateBody);
        return { data: { user: data }, error: null };
      } catch (err: any) {
        return { data: null, error: err };
      }
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      const token = localStorage.getItem('@eventum:token');
      const userStr = localStorage.getItem('@eventum:user');
      if (token && userStr) {
        try {
          callback('SIGNED_IN', { access_token: token, user: JSON.parse(userStr) });
        } catch {}
      }
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  },

  functions: {
    invoke: async (functionName: string, { body }: { body?: any } = {}) => {
      try {
        let res: any = null;

        switch (functionName) {
          case 'create-checkout-session':
            res = (await api.post('/subscriptions/checkout-session', {
              planId: body.plan_id || body.planId,
              billingCycle: body.billing_cycle || body.billingCycle || 'monthly'
            })).data;
            break;

          case 'create-customer-portal':
            res = (await api.post('/subscriptions/customer-portal', body || {})).data;
            break;

          case 'send-invite-email':
            res = (await api.post(`/events/${body.event_id || body.eventId}/guests/send-emails`, {
              guestIds: [body.guest_id || body.guestId]
            })).data;
            break;

          case 'create-mercadopago-payment':
            res = (await api.post(`/public/events/${body.eventId}/mercadopago/create-payment`, body)).data;
            break;

          case 'mercadopago-oauth-start':
            res = (await api.get(`/events/${body.eventId}/mercadopago/oauth-start?redirectUri=${encodeURIComponent(body.redirectUri)}`)).data;
            break;

          case 'mercadopago-oauth-callback':
            res = (await api.post(`/events/${body.eventId}/mercadopago/oauth-callback`, body)).data;
            break;

          case 'mercadopago-oauth-disconnect':
            res = (await api.post(`/events/${body.eventId}/mercadopago/disconnect`)).data;
            break;

          default:
            res = (await api.post(`/functions/${functionName}`, body)).data;
            break;
        }

        return { data: res, error: null };
      } catch (err: any) {
        return { data: null, error: err };
      }
    }
  },

  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: File, options?: any) => {
        try {
          const formData = new FormData();
          formData.append('file', file);
          const endpoint = bucket === 'avatars' ? '/upload/avatar' : '/upload/event-image';
          const { data } = await api.post(endpoint, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          return { data: { path: data.url }, error: null };
        } catch (err: any) {
          return { data: null, error: err };
        }
      },

      getPublicUrl: (path: string) => ({
        data: { publicUrl: path.startsWith('http') ? path : `http://localhost:5000/${path}` }
      }),

      remove: async (paths: string[]) => {
        try {
          for (const p of paths) {
            await api.delete(`/upload?fileUrl=${encodeURIComponent(p)}`);
          }
          return { data: true, error: null };
        } catch (err: any) {
          return { data: null, error: err };
        }
      }
    })
  },

  rpc: async (fnName: string, args: any = {}) => {
    try {
      let res: any = null;

      switch (fnName) {
        case 'get_event_by_slug':
          {
            const slug = args._slug || args.slug;
            const { data } = await api.get(`/public/events/${slug}`);
            res = data ? [data] : [];
          }
          break;

        case 'reserve_gift':
          {
            const giftId = args._gift_id || args.giftId;
            const { data } = await api.post(`/public/gifts/${giftId}/reserve`);
            res = data;
          }
          break;

        case 'get_guest_by_token':
          {
            const token = args._token || args.token;
            const { data } = await api.get(`/public/invite/${token}`);
            res = data ? [data.guest] : [];
          }
          break;

        case 'respond_to_invite':
        case 'respond_to_invite_with_companions':
          {
            const token = args._token || args.token;
            const { data } = await api.post(`/public/invite/${token}/respond`, {
              status: args._status || args.status,
              companionIds: args._companion_ids || args.companionIds || []
            });
            res = data;
          }
          break;

        case 'get_guest_by_reconfirmation_token':
          {
            const token = args._token || args.token;
            const { data } = await api.get(`/public/reconfirmation/${token}`);
            res = data ? [data.guest] : [];
          }
          break;

        case 'respond_to_reconfirmation_with_companions':
          {
            const token = args._token || args.token;
            const { data } = await api.post(`/public/reconfirmation/${token}/respond`, {
              status: args._status || args.status,
              companionIds: args._companion_ids || args.companionIds || []
            });
            res = data;
          }
          break;

        case 'send_second_confirmation':
          {
            const guestId = args._guest_id || args.guestId;
            const eventId = args._event_id || args.eventId;
            const { data } = await api.post(`/events/${eventId}/guests/send-second-confirmation`, {
              all: false,
              guestId
            });
            res = data;
          }
          break;

        case 'send_second_confirmation_to_all':
          {
            const eventId = args._event_id || args.eventId;
            const { data } = await api.post(`/events/${eventId}/guests/send-second-confirmation`, {
              all: true
            });
            res = data;
          }
          break;

        case 'is_superadmin':
          {
            const userStr = localStorage.getItem('@eventum:user');
            if (userStr) {
              const u = JSON.parse(userStr);
              res = u.roles?.includes('superadmin') || false;
            } else {
              res = false;
            }
          }
          break;

        case 'is_admin':
          {
            const userStr = localStorage.getItem('@eventum:user');
            if (userStr) {
              const u = JSON.parse(userStr);
              res = u.roles?.includes('admin') || u.roles?.includes('superadmin') || false;
            } else {
              res = false;
            }
          }
          break;

        case 'create_event_with_owner':
          {
            const { data } = await api.post('/events', {
              eventName: args._event_name || args.eventName,
              eventType: args._event_type || args.eventType || 'wedding',
              eventDate: args._event_date || args.eventDate,
              eventTime: args._event_time || args.eventTime,
              venueName: args._venue_name || args.venueName,
              venueAddress: args._venue_address || args.venueAddress
            });
            res = data.id;
          }
          break;

        default:
          res = null;
          break;
      }

      return { data: res, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }
};