import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Verify caller auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!)
    const { data: { user: caller }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Get caller role
    const { data: callerRoles } = await supabaseAdmin.from('user_roles').select('*').eq('user_id', caller.id)
    const callerRole = callerRoles?.[0]
    if (!callerRole) {
      return new Response(JSON.stringify({ error: 'No admin role' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const body = await req.json()
    const { action } = body

    if (action === 'create') {
      const { email, password, full_name, role, university_id, college_id, department_id } = body

      // Permission checks
      if (callerRole.role === 'super_admin') {
        if (!['university_admin', 'college_admin', 'department_admin'].includes(role)) {
          return new Response(JSON.stringify({ error: 'Invalid role' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
      } else if (callerRole.role === 'university_admin') {
        if (!['college_admin', 'department_admin'].includes(role)) {
          return new Response(JSON.stringify({ error: 'Cannot assign this role' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        if (university_id !== callerRole.university_id) {
          return new Response(JSON.stringify({ error: 'Out of scope' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
      } else if (callerRole.role === 'college_admin') {
        if (role !== 'department_admin') {
          return new Response(JSON.stringify({ error: 'Cannot assign this role' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        if (college_id !== callerRole.college_id) {
          return new Response(JSON.stringify({ error: 'Out of scope' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
      } else {
        return new Response(JSON.stringify({ error: 'No permission' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Create user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      })

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Assign role
      const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
        user_id: newUser.user.id,
        role,
        university_id: university_id || null,
        college_id: college_id || null,
        department_id: department_id || null,
        is_active: true,
      })

      if (roleError) {
        return new Response(JSON.stringify({ error: roleError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      return new Response(JSON.stringify({ success: true, user_id: newUser.user.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } else if (action === 'toggle_active') {
      const { role_id, is_active } = body

      // Get the target role
      const { data: targetRole } = await supabaseAdmin.from('user_roles').select('*').eq('id', role_id).single()
      if (!targetRole) {
        return new Response(JSON.stringify({ error: 'Role not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Permission check
      let allowed = false
      if (callerRole.role === 'super_admin') allowed = true
      else if (callerRole.role === 'university_admin' && callerRole.university_id === targetRole.university_id && ['college_admin', 'department_admin'].includes(targetRole.role)) allowed = true
      else if (callerRole.role === 'college_admin' && callerRole.college_id === targetRole.college_id && targetRole.role === 'department_admin') allowed = true

      if (!allowed) {
        return new Response(JSON.stringify({ error: 'No permission' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Also ban/unban the user in auth
      const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(targetRole.user_id, {
        ban_duration: is_active ? 'none' : '876000h', // ~100 years ban
      })

      if (banError) {
        return new Response(JSON.stringify({ error: banError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const { error: updateError } = await supabaseAdmin.from('user_roles').update({ is_active }).eq('id', role_id)

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } else if (action === 'update_password') {
      const { role_id, new_password } = body

      const { data: targetRole } = await supabaseAdmin.from('user_roles').select('*').eq('id', role_id).single()
      if (!targetRole) {
        return new Response(JSON.stringify({ error: 'Role not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      let allowed = false
      if (callerRole.role === 'super_admin') allowed = true
      else if (callerRole.role === 'university_admin' && callerRole.university_id === targetRole.university_id && ['college_admin', 'department_admin'].includes(targetRole.role)) allowed = true
      else if (callerRole.role === 'college_admin' && callerRole.college_id === targetRole.college_id && targetRole.role === 'department_admin') allowed = true

      if (!allowed) {
        return new Response(JSON.stringify({ error: 'No permission' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(targetRole.user_id, { password: new_password })
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
