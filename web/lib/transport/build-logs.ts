import type winston from 'winston'
import Transport from 'winston-transport'

import { buildLogsInsert } from '@/features/builds/actions'
import { type SnapshotPayload } from '@/types/screenshot'

export class BuildLogsTransport extends Transport {
  async log(info: winston.Logform.TransformableInfo, callback: () => void) {
    try {
      const payload: SnapshotPayload | undefined = info.payload as unknown as SnapshotPayload | undefined
      if (payload) {
        await buildLogsInsert({
          payload: {
            buildId: String(payload.buildId ?? ''),
            snapshotId: String(payload.id ?? ''),
            level: info.level ?? '',
            message: String(info.message),
          },
        })
      }
    } catch (err) {
      console.error('Failed to save log to DB', err)
    }

    callback()
  }
}
