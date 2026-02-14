import { createClient } from '@supabase/supabase-js';

// This script creates a super admin user
// You need to set SUPABASE_SERVICE_ROLE_KEY in your environment

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You need to get this from Supabase dashboard

if (!serviceRoleKey) {
  console.error('Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createSuperAdmin() {
  try {
    // Create user
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email: 'admin@smartuniversity.com',
      password: 'Admin123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'مدير عام'
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return;
    }

    console.log('User created:', user.user.email);

    // Add to profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.user.id,
        user_id: user.user.id,
        full_name: 'مدير عام'
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
    }

    // Add super admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.user.id,
        role: 'super_admin'
      });

    if (roleError) {
      console.error('Error creating role:', roleError);
    }

    console.log('Super admin account created successfully!');
    console.log('Email: admin@smartuniversity.com');
    console.log('Password: Admin123!');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createSuperAdmin();