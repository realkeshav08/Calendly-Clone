import type { Request, Response, NextFunction } from 'express';
import * as service from './availability.service';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await service.listSchedules(req.user.id));
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await service.getSchedule(req.user.id, req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(201).json(await service.createSchedule(req.user.id, req.body));
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await service.updateSchedule(req.user.id, req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await service.deleteSchedule(req.user.id, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function addOverride(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(201).json(await service.upsertDateOverride(req.user.id, req.params.id, req.body));
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
    await service.deleteDateOverride(req.user.id, req.params.id, req.params.overrideId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
