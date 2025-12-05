from django.contrib import admin
from .models import Deck, Card


@admin.register(Deck)
class DeckAdmin(admin.ModelAdmin):
    """Admin interface for Deck model."""
    list_display = ('name', 'user', 'created_at')
    list_filter = ('user', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    """Admin interface for Card model."""
    list_display = (
        'owner',
        'deck',
        'front',
        'due_at',
        'interval',
        'ease_factor',
        'repetitions'
    )
    list_filter = ('owner', 'deck', 'created_at')
    search_fields = ('front', 'back')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Card Content', {
            'fields': ('owner', 'deck', 'front', 'back')
        }),
        ('Spaced Repetition', {
            'fields': (
                'due_at',
                'interval',
                'ease_factor',
                'repetitions',
                'lapses'
            ),
            'description': 'SM-2 algorithm parameters for spaced repetition learning.'
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
