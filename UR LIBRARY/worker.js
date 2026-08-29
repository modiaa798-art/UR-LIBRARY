// ==========================================
// UR LIBRARY - Cloudflare Worker API
// ==========================================

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      // Upload file
      if (pathname === '/api/upload' && request.method === 'POST') {
        return handleUpload(request, env);
      }

      // Delete file
      if (pathname === '/api/delete' && request.method === 'DELETE') {
        return handleDelete(request, env);
      }

      // List files
      if (pathname === '/api/files' && request.method === 'GET') {
        return handleList(request, env);
      }

      // Health check
      if (pathname === '/health') {
        return new Response(JSON.stringify({ status: 'ok' }), {
          headers: CORS_HEADERS,
        });
      }

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: CORS_HEADERS,
      });
    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }
  },
};

// ==========================================
// Handle Upload
// ==========================================

async function handleUpload(request, env) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return new Response(JSON.stringify({ error: 'Only PDF files are allowed' }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File size exceeds 50MB limit' }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}-${random}-${file.name}`;

    // Upload to R2
    await env.BUCKET.put(`uploads/${fileName}`, file, {
      httpMetadata: {
        contentType: 'application/pdf',
      },
    });

    return new Response(JSON.stringify({
      success: true,
      fileName: fileName,
      url: `https://ur-library-files.YOUR_ACCOUNT.r2.cloudflarestorage.com/uploads/${fileName}`,
    }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: 'Upload failed: ' + error.message }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

// ==========================================
// Handle Delete
// ==========================================

async function handleDelete(request, env) {
  try {
    const url = new URL(request.url);
    const fileName = url.searchParams.get('file');

    if (!fileName) {
      return new Response(JSON.stringify({ error: 'No file specified' }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    // Delete from R2
    await env.BUCKET.delete(`uploads/${fileName}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error('Delete error:', error);
    return new Response(JSON.stringify({ error: 'Delete failed: ' + error.message }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

// ==========================================
// Handle List
// ==========================================

async function handleList(request, env) {
  try {
    const { objects } = await env.BUCKET.list({ prefix: 'uploads/' });

    return new Response(JSON.stringify({
      success: true,
      files: objects.map(obj => ({
        name: obj.key.replace('uploads/', ''),
        size: obj.size,
        uploaded: obj.uploaded,
      })),
    }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error('List error:', error);
    return new Response(JSON.stringify({ error: 'List failed: ' + error.message }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}
