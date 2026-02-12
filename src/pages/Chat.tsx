import React, { useEffect, useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Chat: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(full_name)')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true })
        .limit(100);
      setMessages(data || []);
    };
    fetchMessages();

    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as any;
        if (msg.sender_id === user.id || msg.receiver_id === user.id) {
          setMessages(prev => [...prev, msg]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    await supabase.from('messages').insert({ sender_id: user.id, content: newMessage.trim() });
    setNewMessage('');
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center animate-fade-in">
        <MessageCircle className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="mb-4 text-xl font-bold text-foreground">{t('chat.login_required')}</h2>
        <Link to="/login"><Button>{t('nav.login')}</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <h1 className="mb-6 text-3xl font-bold text-foreground flex items-center gap-3">
        <MessageCircle className="h-8 w-8 text-gold" />
        {t('chat.title')}
      </h1>
      <Card className="h-[60vh] flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${m.sender_id === user.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                {m.sender_id !== user.id && <span className="block text-xs font-bold mb-1 opacity-70">{m.sender?.full_name || ''}</span>}
                <p className="text-sm">{m.content}</p>
                <span className="block text-[10px] opacity-50 mt-1">{new Date(m.created_at).toLocaleTimeString(language === 'ar' ? 'ar-IQ' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </CardContent>
        <div className="border-t p-4 flex gap-2">
          <Input 
            value={newMessage} 
            onChange={e => setNewMessage(e.target.value)} 
            placeholder={t('chat.placeholder')}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <Button onClick={sendMessage} className="bg-gold text-gold-foreground hover:bg-gold/90">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Chat;
