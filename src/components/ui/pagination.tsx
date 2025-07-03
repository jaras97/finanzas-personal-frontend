'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const canGoBack = page > 1;
  const canGoForward = page < totalPages;

  return (
    <div className='flex justify-center items-center gap-4 mt-6'>
      <Button
        variant='outline'
        size='icon'
        onClick={() => onPageChange(page - 1)}
        disabled={!canGoBack}
        aria-label='Página anterior'
      >
        <ChevronLeft className='h-5 w-5' />
      </Button>

      <span className='text-sm text-gray-700 dark:text-gray-300'>
        Página <span className='font-semibold'>{page}</span> de{' '}
        <span className='font-semibold'>{totalPages}</span>
      </span>

      <Button
        variant='outline'
        size='icon'
        onClick={() => onPageChange(page + 1)}
        disabled={!canGoForward}
        aria-label='Página siguiente'
      >
        <ChevronRight className='h-5 w-5' />
      </Button>
    </div>
  );
}
