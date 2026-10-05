import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../services/prisma.js';

const router = Router();

const ALLOWED_ASSETS = [
  'Funyula',
  'RISE',
  'PhD Success',
  'Coach Academ',
  'Velo',
  'Safari Books',
  'Scientific Journals Portal',
  'Dubai Analytica',
];
const ALLOWED_STATUSES = ['Todo', 'In Progress', 'Done'];

const assigneeSelect = {
  id: true,
  username: true,
  displayName: true,
  role: true,
};

function serializeAssignee(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  };
}

function normalizeTask(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? undefined,
    asset: task.asset,
    status: task.status,
    assignedToUserId: task.assignedToUserId,
    assignedTo: serializeAssignee(task.assignedToUser),
    createdById: task.createdById ?? undefined,
    createdBy: serializeAssignee(task.createdBy),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function resolveAssigneeUserId(body) {
  if (typeof body?.assignedToUserId === 'string' && body.assignedToUserId.trim()) {
    return body.assignedToUserId.trim();
  }
  if (typeof body?.assignedTo === 'string' && body.assignedTo.trim()) {
    return body.assignedTo.trim();
  }
  return null;
}

async function assertActiveAssignee(userId) {
  const user = await prisma.appUser.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) {
    return null;
  }
  return user;
}

router.use(requireAuth);

router.get('/task-assignees', async (_req, res) => {
  try {
    const users = await prisma.appUser.findMany({
      where: { isActive: true },
      select: assigneeSelect,
      orderBy: [{ displayName: 'asc' }, { username: 'asc' }],
    });
    return res.json({ success: true, data: { users } });
  } catch (error) {
    console.error('Error listing task assignees:', error);
    return res.status(500).json({
      success: false,
      message: 'Error listing task assignees',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.get('/get-tasks', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '10',
      asset,
      assignedTo,
      status,
    } = req.query || {};

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const MAX_LIMIT = 50;
    const limitNum = Math.min(MAX_LIMIT, Math.max(1, parseInt(String(limit), 10) || 10));

    const where = {};
    if (typeof asset === 'string' && asset.trim()) where.asset = asset.trim();
    if (typeof assignedTo === 'string' && assignedTo.trim()) where.assignedToUserId = assignedTo.trim();
    if (typeof status === 'string' && status.trim()) where.status = status.trim();

    const skip = (pageNum - 1) * limitNum;

    const [totalCount, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          assignedToUser: { select: assigneeSelect },
          createdBy: { select: assigneeSelect },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum) || 0;
    const hasNextPage = pageNum < totalPages;
    const hasPreviousPage = pageNum > 1;

    return res.status(200).json({
      success: true,
      data: {
        tasks: tasks.map(normalizeTask),
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          limit: limitNum,
          hasNextPage,
          hasPreviousPage,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.post('/create-task', async (req, res) => {
  try {
    const { title, description, asset, status } = req.body || {};
    const assignedToUserId = resolveAssigneeUserId(req.body);

    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'title is required' });
    }
    if (typeof asset !== 'string' || !asset.trim() || !ALLOWED_ASSETS.includes(asset)) {
      return res.status(400).json({ success: false, message: 'Invalid asset' });
    }
    if (!assignedToUserId) {
      return res.status(400).json({ success: false, message: 'assignedToUserId is required' });
    }
    if (typeof status !== 'string' || !status.trim() || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const assignee = await assertActiveAssignee(assignedToUserId);
    if (!assignee) {
      return res.status(400).json({ success: false, message: 'Invalid or inactive assignee' });
    }

    const descriptionValue =
      typeof description === 'string' && description.trim() ? description.trim() : null;

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: descriptionValue,
        asset,
        assignedToUserId,
        status,
        createdById: req.auth.user.id,
      },
      include: {
        assignedToUser: { select: assigneeSelect },
        createdBy: { select: assigneeSelect },
      },
    });

    return res.status(200).json({
      success: true,
      data: { task: normalizeTask(task) },
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.post('/update-task', async (req, res) => {
  try {
    const { id, title, description, asset, status } = req.body || {};
    const assignedToUserId = resolveAssigneeUserId(req.body);

    if (typeof id !== 'string' || !id.trim()) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'title is required' });
    }
    if (typeof asset !== 'string' || !asset.trim() || !ALLOWED_ASSETS.includes(asset)) {
      return res.status(400).json({ success: false, message: 'Invalid asset' });
    }
    if (!assignedToUserId) {
      return res.status(400).json({ success: false, message: 'assignedToUserId is required' });
    }
    if (typeof status !== 'string' || !status.trim() || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const assignee = await assertActiveAssignee(assignedToUserId);
    if (!assignee) {
      return res.status(400).json({ success: false, message: 'Invalid or inactive assignee' });
    }

    const descriptionValue =
      typeof description === 'string' && description.trim() ? description.trim() : null;

    const task = await prisma.task.update({
      where: { id },
      data: {
        title: title.trim(),
        description: descriptionValue,
        asset,
        assignedToUserId,
        status,
      },
      include: {
        assignedToUser: { select: assigneeSelect },
        createdBy: { select: assigneeSelect },
      },
    });

    return res.status(200).json({
      success: true,
      data: { task: normalizeTask(task) },
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.delete('/delete-task', async (req, res) => {
  try {
    const { id } = req.body || {};

    if (typeof id !== 'string' || !id.trim()) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await prisma.task.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;
