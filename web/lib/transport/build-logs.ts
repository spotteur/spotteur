import type winston from 'winston'
import Transport from 'winston-transport'

import { buildLogsInsert } from '@/features/builds/actions'
import { type BuildLogsInput } from '@/features/logs/schema'
import { type SnapshotPayload } from '@/types/screenshot'

export class BuildLogsTransport extends Transport {
  log(info: winston.Logform.TransformableInfo, callback: () => void) {
    const payload: SnapshotPayload | undefined = info.payload as unknown as SnapshotPayload | undefined
    if (payload && payload.buildId && payload.id) {
      buildLogsInsert({
        payload: {
          buildId: payload.buildId,
          snapshotId: payload.id,
          level: info.level,
          message: String(info.message),
        } satisfies BuildLogsInput,
      }).catch((err) => {
        console.error('Failed to save log to DB', err)
      })
    }

    if (callback) {
      setImmediate(callback)
    }
  }
}
