import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import type { Post } from "@/lib/supabase";
import "server-only";

interface SearchResult {
  answer: string;
  citedPosts: Array<{
    post_id: string;
    title: string;
    content_snippet: string;
    author_name: string;
    author_icon_url?: string;
    created_at: string;
    likes_count: number;
    comments_count: number;
    category: string;
  }>;
}

import { findRelevantPostsForQuery } from "@/lib/searchPosts";

/**
 * 投稿データベースから検索し、Gemini APIで要約・引用しながら回答を生成
 * 
 * 設計方針：
 * 1. まず関連性の高い投稿を検索（findRelevantPostsForQuery）
 * 2. 検索結果をAIに渡して回答を生成
 * 3. プロンプトの長さを制限してAPIエラーを防ぐ
 * 
 * @param query - 検索クエリ（ユーザーの質問）
 * @param topK - 使用する投稿の最大数（デフォルト: 5）
 * @returns AI回答と引用した投稿のリスト
 */
export async function searchWithGemini(
  query: string,
  topK: number = 5
): Promise<SearchResult> {
  try {
    // 1️⃣ 関連性の高い投稿を検索（AIコンシェルジュと同じアプローチ）
    // まずキーワードベースで関連投稿を絞り込む
    let relevantPosts = await findRelevantPostsForQuery(query, topK);
    
    // フォールバック: キーワード検索で見つからない場合、最新の投稿を取得
    if (relevantPosts.length === 0) {
      console.log("[FALLBACK] No relevant posts found, fetching latest posts");
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          author:profiles(name, account_type, verification_status, organization_name, icon_url)
        `)
        .is('community_id', null)
        .order("created_at", { ascending: false })
        .limit(topK);

      if (error) {
        console.error("Error fetching fallback posts:", error);
      } else {
        relevantPosts = (data || []) as Post[];
        console.log(`[FALLBACK] Fetched ${relevantPosts.length} latest posts`);
      }
    }
    
    // それでも投稿が見つからない場合
    if (relevantPosts.length === 0) {
      return {
        answer: "データベース内に十分な情報が見つかりませんでした。",
        citedPosts: [],
      };
    }

    // 2️⃣ Gemini APIクライアントの初期化
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY環境変数が設定されていません");
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      systemInstruction: `あなたは留学支援コミュニティ「RyugakuTalk」のAIアシスタントです。
ユーザーの質問に対して、提供された過去の投稿の内容を根拠として、親切で正確な回答を提供してください。

回答の際は以下の点に注意してください：
- まず、提供された投稿の内容を引用しながら回答してください
- 投稿を引用する際は、必ず「投稿: [タイトル]（投稿者: [名前]）[1]」の形式で、投稿タイトル、投稿者名、そして引用番号[1], [2], [3]...を付けてください
- 引用番号は投稿の順番に対応します（[投稿1]を引用する場合は[1]、[投稿2]を引用する場合は[2]など）
- 投稿の内容を要約し、質問に対する回答として自然な文章で記述してください
- その後、投稿に含まれていない一般的な情報や推奨事項も追加してください
- 投稿の情報と一般的な知識を組み合わせて、より充実した回答を提供してください
- 回答は日本語で、わかりやすく、親切に書いてください
- 回答はMarkdown形式で記述してください（見出し、リスト、太字などが使用可能です）
- 複数の投稿を参考にする場合は、それぞれに引用番号を付けてください
- 回答は必ず100文字以上で、質問に対する具体的な回答を含めてください`,
    });

    // 2️⃣ プロンプトを構築
    // 関連性の高い投稿のみを使用（プロンプトの長さを制御）
    let userPrompt = `以下の質問に回答してください。\n\n質問: ${query}\n\n`;
    
    userPrompt += `参考になる過去の投稿:\n`;
    relevantPosts.forEach((post, index) => {
      userPrompt += `[投稿${index + 1}]\n`;
      userPrompt += `タイトル: ${post.title}\n`;
      userPrompt += `投稿者: ${post.author?.name || '匿名'}\n`;
      // コンテンツの長さを制限（トークン数を節約、最大500文字）
      const contentSnippet = post.content.substring(0, 500);
      userPrompt += `内容: ${contentSnippet}${post.content.length > 500 ? '...' : ''}\n\n`;
    });

    userPrompt += `上記の投稿の内容を根拠として、質問に回答してください。\n`;
    userPrompt += `回答の構成：\n`;
    userPrompt += `1. まず、提供された投稿の内容を引用しながら回答してください\n`;
    userPrompt += `2. 投稿を引用する際は、必ず「投稿: [タイトル]（投稿者: [名前]）[1]」のように引用番号[1], [2], [3]...を付けてください\n`;
    userPrompt += `3. 引用番号は投稿の順番に対応します（[投稿1]を引用する場合は[1]、[投稿2]を引用する場合は[2]など）\n`;
    userPrompt += `4. その後、投稿に含まれていない一般的な情報や推奨事項、アドバイスも追加してください\n`;
    userPrompt += `5. 投稿の情報と一般的な知識を組み合わせて、より充実した回答を提供してください\n`;
    
    console.log(`[DEBUG] Prompt built with ${relevantPosts.length} posts, total length: ${userPrompt.length} characters`);
    
    // プロンプトが長すぎる場合の警告（Gemini APIの制限は約30,000トークン）
    if (userPrompt.length > 20000) {
      console.warn(`[WARNING] Prompt is very long (${userPrompt.length} chars), may cause API errors`);
    }

    // 3️⃣ AI回答を生成
    console.log(`[DEBUG] Generating answer for query: ${query.substring(0, 50)}...`);
    console.log(`[DEBUG] Number of posts: ${relevantPosts.length}`);
    console.log(`[DEBUG] Prompt length: ${userPrompt.length} characters`);
    
    try {
      const result = await model.generateContent(userPrompt);
      const response = await result.response;
      
      // レスポンスの詳細をログに記録
      const answer = response.text();
      
      if (!answer || answer.trim() === "") {
        console.error("[ERROR] Empty response from Gemini API");
        console.error("[ERROR] Response details:", {
          response: response,
        });
        
        // フォールバック: 関連投稿の情報から簡易的な回答を生成
        // ただし、これは最後の手段として使用（通常は発生しない）
        if (relevantPosts.length > 0) {
          console.log("[FALLBACK] Generating fallback answer from relevant posts");
          console.warn("[WARNING] This should not happen frequently. Check API response.");
          
          // より詳細なエラーメッセージを返す
          const fallbackAnswer = `申し訳ございませんが、AIによる回答の生成に失敗しました。\n\n関連する投稿が見つかりましたので、以下をご確認ください：\n\n${relevantPosts.map((post, idx) => `- 投稿: ${post.title}（投稿者: ${post.author?.name || '匿名'}）[${idx + 1}]`).join('\n')}\n\n各投稿をクリックして詳細をご確認ください。`;
          
          return {
            answer: fallbackAnswer,
            citedPosts: relevantPosts.map(post => ({
              post_id: post.id,
              title: post.title,
              content_snippet: post.content.substring(0, 300) + (post.content.length > 300 ? '...' : ''),
              author_name: post.author?.name || '匿名',
              author_icon_url: post.author?.icon_url,
              created_at: post.created_at,
              likes_count: post.likes_count || 0,
              comments_count: post.comments_count || 0,
              category: post.category,
            })),
          };
        }
        
        throw new Error("Gemini APIが空の回答を返しました。プロンプトが長すぎるか、モデルが利用できない可能性があります。");
      }
      
      console.log(`[DEBUG] Answer generated, length: ${answer.length} characters`);
      
      // 回答が短すぎる場合、またはフォールバックパターンが含まれている場合
      const isFallbackPattern = answer.includes('以下の投稿が質問に関連している可能性があります') || 
                                 answer.includes('詳細については、各投稿を確認してください');
      
      if (answer.length < 100 || isFallbackPattern) {
        console.warn(`[WARNING] Answer is very short (${answer.length} chars) or contains fallback pattern`);
        console.warn(`[WARNING] This might indicate API issue. Retrying with more explicit prompt...`);
        
        // 再試行（より明確なプロンプトで）
        const retryPrompt = `${userPrompt}\n\n重要: 上記の投稿の内容を要約し、質問に対する具体的な回答を100文字以上で記述してください。投稿を引用する際は必ず「投稿: [タイトル]（投稿者: [名前]）[1]」の形式で引用番号を付けてください。`;
        
        try {
          const retryResult = await model.generateContent(retryPrompt);
          const retryResponse = await retryResult.response;
          const retryAnswer = retryResponse.text();
          
          if (retryAnswer && retryAnswer.trim().length >= 100 && !retryAnswer.includes('以下の投稿が質問に関連している可能性があります')) {
            console.log(`[DEBUG] Retry successful, answer length: ${retryAnswer.length} characters`);
            // 再試行が成功した場合、その回答を使用
            return {
              answer: retryAnswer.trim(),
              citedPosts: relevantPosts.map(post => ({
                post_id: post.id,
                title: post.title,
                content_snippet: post.content.substring(0, 300) + (post.content.length > 300 ? '...' : ''),
                author_name: post.author?.name || '匿名',
                author_icon_url: post.author?.icon_url,
                created_at: post.created_at,
                likes_count: post.likes_count || 0,
                comments_count: post.comments_count || 0,
                category: post.category,
              })),
            };
          }
        } catch (retryError) {
          console.error("[ERROR] Retry failed:", retryError);
        }
      }
      
      // 3️⃣ 回答から使用された投稿を抽出（引用番号[1], [2]などから）
      const usedPostIndices = new Set<number>();
      
      // 方法1: 投稿タイトルと投稿者名の近くにある引用番号を抽出
      relevantPosts.forEach((post, index) => {
        const citationNum = index + 1;
        const titlePattern = post.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const authorPattern = (post.author?.name || '匿名').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // タイトルと投稿者名の近くに引用番号があるかチェック
        // 例: "投稿: テスト（投稿者: こうたろう）[1]"
        const citationPattern = new RegExp(
          `(?:投稿[：:]?\\s*)?${titlePattern}.*?（投稿者[：:]?\\s*${authorPattern}）.*?\\[${citationNum}\\]`,
          'i'
        );
        
        if (citationPattern.test(answer)) {
          usedPostIndices.add(index);
        }
      });
      
      // 方法2: 引用番号パターンで抽出（投稿タイトルや投稿者名の近くにあるもの）
      const citationPattern = /投稿[：:]?\s*([^（]+)（投稿者[：:]?\s*([^）]+)）\s*\[(\d+)\]/g;
      let match;
      while ((match = citationPattern.exec(answer)) !== null) {
        const citationNum = parseInt(match[3], 10);
        if (citationNum >= 1 && citationNum <= relevantPosts.length) {
          usedPostIndices.add(citationNum - 1);
        }
      }
      
      // 方法3: 単純な引用番号パターン（投稿タイトルや投稿者名が含まれている場合のみ）
      if (usedPostIndices.size === 0) {
        relevantPosts.forEach((post, index) => {
          const titlePattern = new RegExp(post.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
          const authorPattern = new RegExp((post.author?.name || '匿名').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
          
          // タイトルと投稿者名の両方が回答に含まれている場合
          if (titlePattern.test(answer) && authorPattern.test(answer)) {
            usedPostIndices.add(index);
          }
        });
      }

      // 使用された投稿がない場合、すべての関連投稿を使用
      let postsToCite: Post[];
      if (usedPostIndices.size > 0) {
        postsToCite = Array.from(usedPostIndices).map(idx => relevantPosts[idx]);
        console.log(`[DEBUG] Found ${usedPostIndices.size} cited posts from answer`);
      } else {
        // 回答に投稿情報が含まれていない場合、すべての関連投稿を使用
        postsToCite = relevantPosts;
        console.log(`[DEBUG] No post references found in answer, using all ${relevantPosts.length} relevant posts`);
      }
      
      // 回答はそのまま使用（引用番号は残す）
      let cleanedAnswer = answer;

      // 4️⃣ 引用した投稿を整形
      const citedPosts = postsToCite.map(post => ({
        post_id: post.id,
        title: post.title,
        content_snippet: post.content.substring(0, 300) + (post.content.length > 300 ? '...' : ''),
        author_name: post.author?.name || '匿名',
        author_icon_url: post.author?.icon_url,
        created_at: post.created_at,
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        category: post.category,
      }));

      return {
        answer: cleanedAnswer.trim(),
        citedPosts,
      };
    } catch (apiError: any) {
      console.error("[ERROR] Gemini API error:", apiError);
      console.error("[ERROR] Error details:", {
        message: apiError?.message,
        status: apiError?.status,
        code: apiError?.code,
        stack: apiError?.stack,
      });
      
      // より詳細なエラーメッセージを提供
      if (apiError?.message?.includes("SAFETY")) {
        throw new Error("コンテンツが安全フィルターに引っかかりました。質問の内容を変更してお試しください。");
      }
      
      if (apiError?.message?.includes("INVALID_ARGUMENT") || apiError?.message?.includes("invalid")) {
        throw new Error("プロンプトが無効です。プロンプトが長すぎる可能性があります。");
      }
      
      throw apiError;
    }

  } catch (error: any) {
    console.error("Error in searchWithGemini:", error);
    
    // Gemini APIのエラーハンドリング
    if (error?.message?.includes("API key")) {
      throw new Error("Gemini APIキーが無効です");
    }
    
    if (error?.message?.includes("quota") || error?.message?.includes("rate limit")) {
      throw new Error("APIの利用制限に達しました。しばらく待ってから再度お試しください。");
    }

    if (error?.message?.includes("404") || error?.message?.includes("not found")) {
      throw new Error("指定されたモデルが見つかりません。APIキーの設定、支払い情報の登録、または利用可能なモデル名をご確認ください。");
    }

    throw new Error(error?.message || "AI検索の実行中にエラーが発生しました");
  }
}

