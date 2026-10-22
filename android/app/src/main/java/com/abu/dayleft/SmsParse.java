package com.abu.dayleft;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** On-device parsing of debit SMS. Nothing leaves the phone. */
final class SmsParse {
    static final Pattern AMT = Pattern.compile("(?:rs\\.?|inr|\u20b9)\\s*([\\d,]+(?:\\.\\d+)?)", Pattern.CASE_INSENSITIVE);
    static final Pattern DEBIT = Pattern.compile("\\b(debited|spent|paid|sent|withdrawn|purchase)\\b", Pattern.CASE_INSENSITIVE);
    static final Pattern CREDIT = Pattern.compile("\\b(credited|received|refund|deposited)\\b", Pattern.CASE_INSENSITIVE);
    static final Pattern WHO = Pattern.compile("\\b(?:to|at)\\s+([A-Za-z][A-Za-z0-9 &._@-]{1,22}?)(?:\\s+(?:via|on|ref|upi|using|from)\\b|[.,;]|$)", Pattern.CASE_INSENSITIVE);

    /** returns {amount, merchant} or null when the SMS is not a debit. */
    static String[] parse(String t) {
        if (t == null) return null;
        if (!DEBIT.matcher(t).find()) return null;
        if (CREDIT.matcher(t).find() && !t.toLowerCase().contains("debited")) return null;
        Matcher m = AMT.matcher(t);
        if (!m.find()) return null;
        long a = Math.round(Double.parseDouble(m.group(1).replace(",", "")));
        if (a <= 0) return null;
        Matcher w = WHO.matcher(t);
        return new String[]{String.valueOf(a), w.find() ? w.group(1).trim() : ""};
    }
}
