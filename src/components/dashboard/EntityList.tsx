import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  title: string;
  items: any[];
  entityType: string;
  showAdd?: boolean;
  showDelete?: boolean;
  onAdd: () => void;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  getSubtitle?: (item: any) => string | null;
}

const EntityList: React.FC<Props> = ({ title, items, showAdd = true, showDelete = true, onAdd, onEdit, onDelete, getSubtitle }) => {
  const { t, language } = useLanguage();
  const getName = (item: any) => language === 'ar' ? item.name_ar : (item.name_en || item.name_ar);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {showAdd && (
          <Button onClick={onAdd} className="bg-gold text-gold-foreground">
            <Plus className="h-4 w-4 me-1" />{t('common.add')}
          </Button>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map(item => (
          <Card key={item.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <span className="font-semibold">{getName(item)}</span>
                {getSubtitle && getSubtitle(item) && (
                  <span className="block text-xs text-muted-foreground">{getSubtitle(item)}</span>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                  <Edit className="h-4 w-4" />
                </Button>
                {showDelete && (
                  <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default React.memo(EntityList);
