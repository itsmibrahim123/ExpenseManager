package com.practice.expensemngr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

import java.io.Serializable;

@Entity
@Getter
@Setter
@ToString
@SuperBuilder
@NoArgsConstructor
@Table(name = "transaction_tags")
@IdClass(TransactionTagsId.class)  // ⬅️ THIS LINE FIXES THE ERROR
public class TransactionTags implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @Column(name = "transaction_id", nullable = false)
    private Long transactionId;

    @Id
    @Column(name = "tag_id", nullable = false)
    private Long tagId;

}