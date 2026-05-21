import type { Request, Response, NextFunction } from 'express';
import { container } from '../../container';

const service = container.availabilityService;

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await service.list(req.user.id));
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await service.getForUser(req.user.id, req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(201).json(await service.create(req.user.id, req.body));
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await service.update(req.user.id, req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await service.delete(req.user.id, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function addOverride(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await service.addOverride(req.user.id, req.params.id, req.body);
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function removeOverride(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await service.removeOverride(req.user.id, req.params.id, req.params.overrideId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
