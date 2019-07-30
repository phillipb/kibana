/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import {
  PROCESSOR_EVENT,
  SERVICE_NAME,
  TRACE_ID,
  TRANSACTION_DURATION,
  TRANSACTION_ID,
  TRANSACTION_NAME,
  TRANSACTION_SAMPLED,
  TRANSACTION_TYPE
} from '../../../../../common/elasticsearch_fieldnames';
import { rangeFilter } from '../../../helpers/range_filter';
import { Setup } from '../../../helpers/setup_request';

export function bucketFetcher({
  serviceName,
  transactionName,
  transactionType,
  transactionId,
  traceId,
  bucketSize,
  setup
}: {
  serviceName: string;
  transactionName: string;
  transactionType: string;
  transactionId?: string;
  traceId?: string;
  bucketSize: number;
  setup: Setup;
}) {
  const { start, end, uiFiltersES, client, config } = setup;
  const bucketTargetCount = config.get<number>('xpack.apm.bucketTargetCount');

  const params = {
    index: config.get<string>('apm_oss.transactionIndices'),
    body: {
      size: 0,
      query: {
        bool: {
          filter: [
            { term: { [SERVICE_NAME]: serviceName } },
            { term: { [PROCESSOR_EVENT]: 'transaction' } },
            { term: { [TRANSACTION_TYPE]: transactionType } },
            { term: { [TRANSACTION_NAME]: transactionName } },
            { range: rangeFilter(start, end) },
            ...uiFiltersES
          ],
          should: [
            { term: { [TRACE_ID]: traceId } }, // TODO: might fail when undefined
            { term: { [TRANSACTION_ID]: transactionId } }, // TODO: might fail when undefined
            { term: { [TRANSACTION_SAMPLED]: true } }
          ]
        }
      },
      aggs: {
        distribution: {
          histogram: {
            field: TRANSACTION_DURATION,
            interval: bucketSize,
            min_doc_count: 0,
            extended_bounds: {
              min: 0,
              max: bucketSize * bucketTargetCount
            }
          },
          aggs: {
            sample: {
              top_hits: {
                _source: [TRANSACTION_ID, TRANSACTION_SAMPLED, TRACE_ID],
                size: 1
              }
            }
          }
        }
      }
    }
  };

  return client.search(params);
}
