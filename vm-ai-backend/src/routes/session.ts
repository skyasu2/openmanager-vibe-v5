/**
 * 🧠 Session Management Router
 * 
 * AI 대화 세션 관리 API
 */

import { Router } from 'express';
import { sessionManager } from '../index';

const router = Router();

/**
 * POST /api/ai/session
 * 새 세션 생성
 */
router.post('/', (req, res) => {
  try {
    const { userId, initialContext } = req.body;
    const session = sessionManager.createSession(userId, initialContext);
    
    res.status(201).json({
      success: true,
      session: {
        id: session.id,
        userId: session.userId,
        createdAt: session.metadata.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create session'
    });
  }
});

/**
 * GET /api/ai/session/:sessionId
 * 세션 조회
 */
router.get('/:sessionId', (req, res) => {
  try {
    const session = sessionManager.getSession(req.params.sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    res.json({
      success: true,
      session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get session'
    });
  }
});

/**
 * GET /api/ai/session/:sessionId/context
 * 세션 컨텍스트 요약 조회
 */
router.get('/:sessionId/context', (req, res) => {
  try {
    const context = sessionManager.getSessionContext(req.params.sessionId);
    
    if (!context) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    res.json({
      success: true,
      context
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get session context'
    });
  }
});

/**
 * POST /api/ai/session/:sessionId/message
 * 세션에 메시지 추가
 */
router.post('/:sessionId/message', (req, res) => {
  try {
    const { role, content, metadata } = req.body;
    
    if (!role || !content) {
      return res.status(400).json({
        success: false,
        error: 'Role and content are required'
      });
    }
    
    const message = sessionManager.addMessage(req.params.sessionId, {
      role,
      content,
      metadata
    });
    
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    res.json({
      success: true,
      message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add message'
    });
  }
});

/**
 * GET /api/ai/session/user/:userId
 * 사용자의 모든 세션 조회
 */
router.get('/user/:userId', (req, res) => {
  try {
    const sessions = sessionManager.getUserSessions(req.params.userId);
    
    res.json({
      success: true,
      sessions: sessions.map(s => ({
        id: s.id,
        messageCount: s.metadata.messageCount,
        createdAt: s.metadata.createdAt,
        lastActiveAt: s.metadata.lastActiveAt,
        summary: s.summary
      })),
      total: sessions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user sessions'
    });
  }
});

/**
 * DELETE /api/ai/session/:sessionId
 * 세션 삭제
 */
router.delete('/:sessionId', (req, res) => {
  try {
    const deleted = sessionManager.deleteSession(req.params.sessionId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete session'
    });
  }
});

/**
 * GET /api/ai/session/stats
 * 세션 통계
 */
router.get('/stats/overview', (req, res) => {
  try {
    const stats = sessionManager.getStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats'
    });
  }
});

export const sessionRouter = router;