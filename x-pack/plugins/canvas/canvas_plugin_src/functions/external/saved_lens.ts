/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ExpressionFunctionDefinition } from 'src/plugins/expressions/common';
import { PaletteOutput } from 'src/plugins/charts/common';
import { TimeRange, Filter as DataFilter } from 'src/plugins/data/public';
import { EmbeddableInput } from 'src/plugins/embeddable/public';
import { getQueryFilters } from '../../../public/lib/build_embeddable_filters';
import { ExpressionValueFilter, TimeRange as TimeRangeArg } from '../../../types';
import {
  EmbeddableTypes,
  EmbeddableExpressionType,
  EmbeddableExpression,
} from '../../expression_types';
import { getFunctionHelp } from '../../../i18n';

interface Arguments {
  id: string;
  title: string | null;
  timerange: TimeRangeArg | null;
  palette?: PaletteOutput;
}

export type SavedLensInput = EmbeddableInput & {
  id: string;
  timeRange?: TimeRange;
  filters: DataFilter[];
  palette?: PaletteOutput;
};

const defaultTimeRange = {
  from: 'now-15m',
  to: 'now',
};

type Return = EmbeddableExpression<SavedLensInput>;

export function savedLens(): ExpressionFunctionDefinition<
  'savedLens',
  ExpressionValueFilter | null,
  Arguments,
  Return
> {
  const { help, args: argHelp } = getFunctionHelp().savedLens;
  return {
    name: 'savedLens',
    help,
    args: {
      id: {
        types: ['string'],
        required: false,
        help: argHelp.id,
      },
      timerange: {
        types: ['timerange'],
        help: argHelp.timerange,
        required: false,
      },
      title: {
        types: ['string'],
        help: argHelp.title,
        required: false,
      },
      palette: {
        types: ['palette'],
        help: argHelp.palette!,
        required: false,
      },
    },
    type: EmbeddableExpressionType,
    fn: (input, args) => {
      const filters = input ? input.and : [];

      return {
        type: EmbeddableExpressionType,
        input: {
          id: args.id,
          filters: getQueryFilters(filters),
          timeRange: args.timerange || defaultTimeRange,
          title: args.title === null ? undefined : args.title,
          disableTriggers: true,
          palette: args.palette,
          renderMode: 'noInteractivity',
        },
        embeddableType: EmbeddableTypes.lens,
        generatedAt: Date.now(),
      };
    },
  };
}
