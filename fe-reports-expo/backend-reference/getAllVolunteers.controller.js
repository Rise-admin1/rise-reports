/**
 * Drop-in replacement for getAllVolunteers (Express + Prisma).
 * Expects query: offset, limit, optional role = ALL | POLLING_AGENT | BLOGGING_TEAM | VOTER
 * Route stays: volunteerRouter.get('/all', getAllVolunteers);
 *
 * Add at top of your file: import prisma from '<your-prisma-client-path>';
 */

const ROLE_FILTERS = new Set(['ALL', 'POLLING_AGENT', 'BLOGGING_TEAM', 'VOTER']);

function parseRoleFilter(raw) {
  const s = String(raw ?? 'ALL').trim().toUpperCase();
  return ROLE_FILTERS.has(s) ? s : 'ALL';
}

export const getAllVolunteers = async (req, res) => {
  try {
    const rawOffset = req.query?.offset;
    const rawLimit = req.query?.limit;

    const parsedOffset = Number.parseInt(String(rawOffset ?? '0'), 10);
    const parsedLimit = Number.parseInt(String(rawLimit ?? '20'), 10);

    const offset = Number.isNaN(parsedOffset) ? 0 : Math.max(0, parsedOffset);
    const limitCandidate = Number.isNaN(parsedLimit) ? 20 : parsedLimit;
    const limit = Math.min(100, limitCandidate <= 0 ? 20 : limitCandidate);

    const roleFilter = parseRoleFilter(req.query?.role);
    const where = roleFilter === 'ALL' ? {} : { role: roleFilter };

    const totalCount = await prisma.userVolunteer.count({ where });

    const volunteers = await prisma.userVolunteer.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        role: true,
        gender: true,
        ward: true,
        location: true,
        subLocation: true,
        pollingStation: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      data: volunteers,
      pagination: {
        offset,
        limit,
        totalCount,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
