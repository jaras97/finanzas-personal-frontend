'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FormModal } from '@/components/ui/form-modal';
import { Button } from '@/components/ui/button';
import InfoHint from '@/components/ui/info-hint';
import { toast } from 'sonner';
import api from '@/lib/api';
import axios from 'axios';
import type { Attachment } from '@/types';
import { FileText, ImageIcon, Trash2, Upload, ExternalLink } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: number | null;
  description?: string | null;
  /** Se llama tras subir o borrar, para refrescar el contador en la lista. */
  onChanged?: () => void;
}

const MAX_MB = 5;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentsModal({
  open,
  onOpenChange,
  transactionId,
  description,
  onChanged,
}: Props) {
  const [items, setItems] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const fetchItems = useCallback(async () => {
    if (!transactionId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/transactions/${transactionId}/attachments`);
      setItems(data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error?.response?.data?.detail || 'No se pudieron cargar los comprobantes');
      }
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    if (open) fetchItems();
    else setItems([]);
  }, [open, fetchItems]);

  const handleUpload = async (file: File) => {
    if (!transactionId) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      await api.post(`/transactions/${transactionId}/attachments`, form);
      toast.success('Comprobante adjuntado');
      await fetchItems();
      onChanged?.();
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error?.response?.data?.detail || 'No se pudo adjuntar el comprobante'
          : 'Error inesperado',
      );
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    setBusyId(attachment.id);
    try {
      await api.delete(`/attachments/${attachment.id}`);
      toast.success('Comprobante eliminado');
      await fetchItems();
      onChanged?.();
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error?.response?.data?.detail || 'No se pudo eliminar'
          : 'Error inesperado',
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <FormModal
      open={open}
      onOpenChange={(o) => !uploading && onOpenChange(o)}
      className='w-[min(100vw-1rem,520px)]'
      title={
        <>
          Comprobantes
          <InfoHint side='top'>
            Adjunta la foto del recibo o el PDF del banco. Imágenes o PDF, hasta {MAX_MB} MB,
            máximo 5 por movimiento.
          </InfoHint>
        </>
      }
    >
      <div className='space-y-4'>
        {description && (
          <p className='text-sm text-muted-foreground truncate'>{description}</p>
        )}

        <input
          ref={fileInput}
          type='file'
          accept='image/jpeg,image/png,image/webp,image/heic,application/pdf'
          className='hidden'
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />

        <Button
          variant='soft-sky'
          className='w-full'
          disabled={uploading || items.length >= 5}
          onClick={() => fileInput.current?.click()}
        >
          <Upload className='h-4 w-4 mr-2' />
          {uploading
            ? 'Subiendo…'
            : items.length >= 5
            ? 'Máximo alcanzado (5)'
            : 'Adjuntar comprobante'}
        </Button>

        {loading ? (
          <p className='text-sm text-muted-foreground text-center py-4'>Cargando…</p>
        ) : items.length === 0 ? (
          <p className='text-sm text-muted-foreground text-center py-4'>
            Este movimiento aún no tiene comprobantes.
          </p>
        ) : (
          <ul className='space-y-2'>
            {items.map((item) => {
              const isPdf = item.content_type === 'application/pdf';
              return (
                <li
                  key={item.id}
                  className='flex items-center gap-3 rounded-lg border border-slate-200 p-2'
                >
                  {isPdf ? (
                    <FileText className='h-5 w-5 shrink-0 text-rose-600' />
                  ) : (
                    <ImageIcon className='h-5 w-5 shrink-0 text-sky-600' />
                  )}
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm truncate'>{item.filename}</p>
                    <p className='text-xs text-muted-foreground'>
                      {formatSize(item.size_bytes)}
                    </p>
                  </div>
                  {item.url && (
                    <Button size='sm' variant='soft-slate' asChild>
                      <a
                        href={item.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        aria-label={`Abrir ${item.filename}`}
                      >
                        <ExternalLink className='h-4 w-4' />
                      </a>
                    </Button>
                  )}
                  <Button
                    size='sm'
                    variant='soft-rose'
                    disabled={busyId === item.id}
                    onClick={() => handleDelete(item)}
                    aria-label={`Eliminar ${item.filename}`}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </FormModal>
  );
}
