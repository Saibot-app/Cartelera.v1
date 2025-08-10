import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Use descriptive variable names with fallbacks
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('PROJECT_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  // Comprehensive environment variable logging
  console.log('🔍 Environment Variable Check:');
  console.log('📍 SUPABASE_URL:', SUPABASE_URL ? `${SUPABASE_URL.substring(0, 20)}...` : 'MISSING');
  console.log('📍 SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? `${SUPABASE_SERVICE_ROLE_KEY.substring(0, 10)}...` : 'MISSING');

  // Validate environment variables
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    const errorMsg = `Missing environment variables - URL: ${!!SUPABASE_URL}, KEY: ${!!SUPABASE_SERVICE_ROLE_KEY}`;
    console.error('❌', errorMsg);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMsg,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Parse and validate request body
  let payload: any = {};
  try {
    payload = await req.json();
  } catch {
    console.log('❌ Returning error response: Invalid JSON body');
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('🚀 Starting user creation process...');
  console.log('📧 Email received:', payload?.email);
  console.log('👤 Full name:', payload?.full_name);
  console.log('🏢 Company ID:', payload?.company_id);
  console.log('🔑 Role:', payload?.role);

  // Create service role client with detailed logging
  console.log('🔧 Initializing Supabase admin client...');
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { 
      headers: { 
        'x-application-name': 'create-company-user',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      } 
    },
  });

  console.log('✅ Admin client initialized');

  // Test admin client authentication immediately
  console.log('🧪 Testing admin client authentication...');
  try {
    const { data: authTest, error: authTestError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    
    if (authTestError) {
      console.error('❌ Admin client auth test failed:', authTestError);
      console.log('❌ Returning error response: Admin authentication failed');
      return new Response(
        JSON.stringify({
          success: false,
          error: `Admin authentication failed: ${authTestError.message}`
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ Admin client authenticated successfully');
  } catch (authError: any) {
    console.error('💥 Admin client auth test exception:', authError);
    console.log('❌ Returning error response: Admin authentication exception');
    return new Response(
      JSON.stringify({
        success: false,
        error: `Admin authentication exception: ${authError.message}`,
        stack: authError.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { email, full_name, company_id, role = 'admin' } = payload || {};
  if (!email) {
    console.log('❌ Returning error response: email is required');
    return new Response(
      JSON.stringify({
        success: false,
        error: 'email is required',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!full_name) {
    console.log('❌ Returning error response: full_name is required');
    return new Response(
      JSON.stringify({
        success: false,
        error: 'full_name is required',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const cleanEmail = email.toLowerCase().trim();
  
  // Add email format validation before processing
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    console.error('Invalid email format received:', cleanEmail);
    console.log('❌ Returning error response: Invalid email format');
    return new Response(
      JSON.stringify({
        success: false,
        error: `Invalid email format received: ${cleanEmail}`
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  console.log('✅ Processing user creation for:', cleanEmail);

  // Add password generation function
  function generateSecurePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    
    // Ensure minimum requirements: 1 uppercase, 1 lowercase, 1 number, 1 symbol
    password += 'A'; // uppercase
    password += 'a'; // lowercase  
    password += '1'; // number
    password += '!'; // symbol
    
    // Fill remaining 12 characters randomly
    for (let i = 4; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  try {
    // Step 1: Verify company exists (if company_id provided)
    let companyData = null;
    if (company_id) {
      console.log('🔍 Step 1: Verifying company exists with SERVICE_ROLE...');
      const { data: company, error: companyError } = await admin
        .from('companies')
        .select('id, name')
        .eq('id', company_id)
        .single()

      if (companyError || !company) {
        console.error('🚨 Company verification failed with SERVICE_ROLE:', companyError);
        console.log('❌ Returning error response: Company not found');
        return new Response(
          JSON.stringify({ 
            success: false,
            error: `Company not found: ${company_id} (SERVICE_ROLE Error: ${companyError?.message || 'Unknown'})`
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      companyData = company;
      console.log('✅ Company verified with SERVICE_ROLE:', companyData.name);
    } else {
      console.log('ℹ️ Step 1: No company_id provided, skipping company verification');
    }

    // Step 2: Check if user exists in auth.users
    console.log('🔍 Step 2: Checking if user exists in auth.users...');
    let authUser = null;
    
    try {
      const { data: { users }, error: authCheckError } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      });
      
      if (authCheckError) {
        console.error('🚨 Error checking auth user:', authCheckError);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: `Failed to check auth user: ${authCheckError.message}`
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Find user by email in the list
      authUser = users.find(user => user.email === cleanEmail) || null;
      console.log('✅ Auth user check completed. Exists:', !!authUser);
    } catch (authError: any) {
      console.error('💥 Auth user check exception:', authError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Auth user check failed: ${authError.message}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Create auth user if doesn't exist
    if (!authUser) {
      console.log('➕ Step 3: Creating new auth user...');
      const userPassword = payload.password || generateSecurePassword();
      
      const { data: createResult, error: createError } = await admin.auth.admin.createUser({
        email: cleanEmail,
        password: userPassword,
        email_confirm: true,
        user_metadata: {
          full_name: full_name
        }
      });

      if (createError) {
        console.error('🚨 Auth user creation failed:', createError);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: `Failed to create auth user: ${createError.message}`
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      authUser = createResult.user;
      console.log('✅ Auth user created:', authUser?.id);
    } else {
      console.log('ℹ️ Step 3: Using existing auth user:', authUser.id);
      
      // Update password if provided
      if (payload.password) {
        console.log('🔄 Updating auth user password...');
        const { error: updateError } = await admin.auth.admin.updateUserById(authUser.id, {
          password: payload.password
        });
        
        if (updateError) {
          console.error('🚨 Password update failed:', updateError);
          return new Response(
            JSON.stringify({ 
              success: false,
              error: `Failed to update password: ${updateError.message}`
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        console.log('✅ Password updated successfully');
      }
    }

    if (!authUser?.id) {
      console.error('🚨 No auth user ID available');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to get auth user ID'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = authUser.id;

    // Step 4: Check if user exists in public.users table
    console.log('🔍 Step 4: Checking if user exists in public.users table...');
    const { data: existingUser, error: checkUserError } = await admin
      .from('users')
      .select('id, email, company_id, role')
      .eq('id', userId)
      .maybeSingle()

    if (checkUserError) {
      console.error('🚨 Error checking existing user with SERVICE_ROLE:', checkUserError);
      console.log('❌ Returning error response: Failed to check public user');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Failed to check public user (SERVICE_ROLE Error): ${checkUserError.message}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let userResult: any;

    if (!existingUser) {
      // Step 5: Create user in public.users table
      console.log('➕ Step 5: Creating user in public.users table...');
      
      const { data: newUser, error: insertError } = await admin
        .from('users')
        .insert({
          id: userId,
          email: cleanEmail,
          full_name: full_name,
          role: role,
          company_id: company_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        console.error('🚨 Public user creation failed with SERVICE_ROLE:', insertError);
        console.log('❌ Returning error response: Failed to create user record');
        return new Response(
          JSON.stringify({ 
            success: false,
            error: `Failed to create user record (SERVICE_ROLE Error): ${insertError.message}`
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      userResult = newUser;
      console.log('✅ Public user created:', userResult);
    } else {
      // Step 5: Update existing user in public.users
      console.log('🔄 Step 5: Updating existing user record with SERVICE_ROLE...');
      
      const { data: updatedUser, error: updateError } = await admin
        .from('users')
        .update({ 
          company_id: company_id || null,
          role: role,
          full_name: full_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (updateError) {
        console.error('🚨 User update failed with SERVICE_ROLE:', updateError);
        console.log('❌ Returning error response: Failed to update user profile');
        return new Response(
          JSON.stringify({ 
            success: false,
            error: `Failed to update user profile (SERVICE_ROLE Error): ${updateError.message}`
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      userResult = updatedUser;
      console.log('✅ User record updated successfully with SERVICE_ROLE');
    }

    // Step 6: Handle company_users relationship (only if company_id provided)
    if (company_id) {
      console.log('🏢 Step 6: Creating/updating company_users relationship with SERVICE_ROLE...');
      
      const { data: companyUserResult, error: relationError } = await admin
        .from('company_users')
        .upsert({
          user_id: userId,
          company_id: company_id,
          role: 'super_admin',
          is_active: true,
        }, {
          onConflict: 'user_id,company_id'
        })
        .select()
        .single()

      if (relationError) {
        console.error('🚨 Company relation failed with SERVICE_ROLE:', relationError);
        console.log('❌ Returning error response: Failed to create company relationship');
        
        // Optionally delete the user if company relationship fails
        if (!existingUser) {
          console.log('🧹 Cleaning up: Deleting created user due to company relationship failure...');
          await admin.from('users').delete().eq('id', userId);
          await admin.auth.admin.deleteUser(userId);
        }
        
        return new Response(
          JSON.stringify({ 
            success: false,
            error: `Failed to create company relationship (SERVICE_ROLE Error): ${relationError.message}`
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('✅ Company relationship created:', companyUserResult);
      console.log('✅ Company relationship created/updated successfully with SERVICE_ROLE');
    } else {
      console.log('ℹ️ Step 6: No company_id provided, skipping company_users relationship');
    }

    console.log('🎉 User creation/assignment completed successfully!');
    console.log('✅ Returning success response');

    // Return success with user details
    return new Response(
      JSON.stringify({ 
        success: true,
        message: existingUser 
          ? 'User updated successfully'
          : 'User created successfully',
        user: {
          id: userId,
          email: cleanEmail,
          full_name: full_name,
          role: role,
          company_id: company_id || null
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('💥 Global exception in edge function:', err);
    console.error('📚 Error stack:', err.stack);
    console.log('❌ Returning error response: Global Edge Function Error');
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Global Edge Function Error: ${err?.message ?? 'Unexpected error'}`,
        stack: err?.stack || 'No stack trace available'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})