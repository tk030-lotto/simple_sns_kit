import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkUserActive } from '@/lib/auth';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB



export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json(
      { success: false, error: '認証情報 (x-user-id) が必要です。' },
      { status: 401 }
    );
  }

  // 1. 有効期限チェック
  const activeCheck = await checkUserActive(userId);
  if (!activeCheck.active) {
    return NextResponse.json(
      { success: false, error: activeCheck.error, code: 'USER_INACTIVE' },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'ファイルが見つかりません。' },
        { status: 400 }
      );
    }

    const ALLOWED_MIME_TYPES = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain',
    ];
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: '許可されていないファイル形式です。' },
        { status: 400 }
      );
    }

    // IMP-05: ファイルサイズ上限チェック（10MB）
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'ファイルサイズが上限（10MB）を超えています。' },
        { status: 413 }
      );
    }

    const buffer = await file.arrayBuffer();
    let uint8Array = new Uint8Array(buffer);

    // ファイル名が重複しないようタイムスタンプとランダム文字列を付与
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    const uniqueId = Math.random().toString(36).substring(2, 8);
    const fileName = `${Date.now()}-${uniqueId}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    let contentType = file.type || 'application/octet-stream';
    const isTextFile = contentType.startsWith('text/') || contentType.includes('markdown') || contentType.includes('json') || contentType.includes('csv') || fileExt === 'txt' || fileExt === 'md' || fileExt === 'csv';

    // テキスト系ファイルの場合は明示的にUTF-8を指定し、さらにBOMを付与してスマホ（iOS等）での文字化けを完全防止する
    if (isTextFile) {
      if (!contentType.includes('charset')) {
        contentType += '; charset=utf-8';
      }
      
      // UTF-8 BOM (EF BB BF) が先頭にない場合は付与する
      if (!(uint8Array.length >= 3 && uint8Array[0] === 0xef && uint8Array[1] === 0xbb && uint8Array[2] === 0xbf)) {
        const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
        const withBom = new Uint8Array(bom.length + uint8Array.length);
        withBom.set(bom);
        withBom.set(uint8Array, bom.length);
        uint8Array = withBom;
      }
    }

    // Supabase Storage にアップロード
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('sns-media')
      .upload(filePath, uint8Array, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: 'ファイルのアップロードに失敗しました。' },
        { status: 500 }
      );
    }

    // パブリックURLを取得
    const { data: { publicUrl } } = supabase.storage
      .from('sns-media')
      .getPublicUrl(filePath);

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error('Unexpected upload error:', err);
    return NextResponse.json(
      { success: false, error: 'システムエラーが発生しました。' },
      { status: 500 }
    );
  }
}
